import { cloneDeep } from "lodash";

function toTextNode(node: Node): Node {
  if (node.nodeType === Node.TEXT_NODE) return node;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const firstText = walker.nextNode();
  return firstText ?? node;
}

// funzione che scompone un Range in chunk di testo, restituendo sia l'array di chunk
// dove troviamo l'id del nodo di testo e il testo stesso, sia una mappa che dall'id
// riprende il nodo del dom, fondamentale per ricostruire il range dopo la risposta dell'LLM
function buildChunkProjection(range: Range): {
  chunks: { id: string; text: string }[];
  chunkMap: Map<string, Text>;
} {
  const chunks: { id: string; text: string }[] = [];
  const chunkMap = new Map<string, Text>();
  // commonAncestorContainer individua il sottoalbero minimo che contiene
  // l'intero range: è la radice da cui far partire il TreeWalker.
  const root =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? (range.commonAncestorContainer.parentNode as Element)
      : (range.commonAncestorContainer as Element);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    // accettiamo solo i nodi di testo che intersecano davvero il range,
    // scartando testo che sta fuori dalla selezione originale
    acceptNode: (node) =>
      range.intersectsNode(node)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });

  let i = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent?.trim();
    if (!text) {
      continue;
    }
    // se abbiamo individuato un nodo di testo valido,
    // gli assegniamo un id univoco e lo aggiungiamo all'array di chunk e alla mappa
    const id = `c${++i}`;
    chunks.push({ id, text });
    chunkMap.set(id, node);
  }

  return { chunks, chunkMap };
}

/**
 * Calcola l'XPath assoluto (relativo a <body>) di un nodo elemento,
 * risalendo verso l'alto e contando gli indici tra fratelli con lo
 * stesso tag. È l'operazione INVERSA di restoreRangeFromPayload, che
 * invece usa document.evaluate() per andare da XPath a nodo reale.
 * Serve per ricostruire rangeSelector.startContainer/endContainer.
 */
function getXPathForNode(node: Node): string {
  // se il nodo di partenza è un Text, l'XPath va calcolato sul suo
  // elemento genitore (gli XPath non puntano direttamente ai text node)
  let current: Node | null =
    node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

  const parts: string[] = [];

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const el = current as Element;
    let index = 1;
    let sibling = el.previousElementSibling;
    // conta quanti fratelli precedenti hanno lo stesso tag, per
    // costruire l'indice posizionale usato nella sintassi XPath (tag[N])
    while (sibling) {
      if (sibling.tagName === el.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${el.tagName.toLowerCase()}[${index}]`);
    current = el.parentElement;
    if (current === document.body) break;
  }

  return "/" + parts.join("/");
}

/* 
    Questa funzione trasforma un Range del DOM nella struttra che si 
    aspetta la funzione saveAnnotation, e quindi la struttura
    utilizzata dall'annotatore, ricostruendo subject.selected: rangeSelector,
    textPositionSelector e textQuoteSelector.
   */
function serializeRangeToSelector(range: Range): any {
  const startXPath = getXPathForNode(range.startContainer);
  const endXPath = getXPathForNode(range.endContainer);
  const text = range.toString();

  // Questa è una soluzione semplice per ricercare il testo selezionato dal body,
  // infatti in questo modo, con la funzione indexOf, potremmo ottenere dei comportamenti inattesi
  // per testi identici in più parti della pagina, perchè indexOf prende la prima occorrenza
  const bodyText = document.body.textContent ?? "";
  const start = bodyText.indexOf(text);
  const end = start >= 0 ? start + text.length : -1;

  const prefix =
    start > 0 ? bodyText.slice(Math.max(0, start - 20), start) : "";
  const suffix = end > 0 ? bodyText.slice(end, end + 20) : "";

  return {
    text,
    rangeSelector: {
      startContainer: startXPath,
      endContainer: endXPath,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    },
    textPositionSelector: { start, end },
    textQuoteSelector: { exact: text, prefix, suffix },
  };
}

/*
   Flusso completo per un annotazione con richiesta AI:
   1) dal payload originale viene ricostruito il range reale del dom;
   2) il range viene scomposto in chunk di testo, salvato con un id e mappato al nodo reale;
   3) a pundit homex vengono mandati solo i chunk con id semplice e testo, oltre che al prompt utente;
   4) riceve dall'LLM quali chunk (e quale porzione esatta di testo,
     "quote") devono essere effettivamente annotati;
   5) per ogni porzione di testo indicata dalla risposta, viene ritrovato il nodo dalla mappa tramite l'id
      e viene ricostruito un range preciso, che viene trasformato in un payload da mandare a saveAnnotation;
   */
export default async function mapChunks(
  annotationPayload: any,
  aiRequest: string,
): Promise<any[]> {
  // Step 1: dal payload originale (con rangeSelector/textQuoteSelector)
  // viene ricostruito il Range reale nel DOM corrente.
  const range = restoreRangeFromPayload(annotationPayload);
  if (!range) {
    console.warn("[mapChunks] Range non trovato nel DOM");
    return [];
  }

  // Step 2: a questo punto dal range reale possiamo prendere i chunk di testo
  // e creare le nostre strutture da mandare poi all'LLM
  const { chunks, chunkMap } = buildChunkProjection(range);

  // Step 3: inviamo SOLO i chunk testuali e il prompt a
  // pundithomex, che gestisce la chiave e interroga l'LLM.
  const response = await fetch("https://app.thepund.test/ai/annotate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chunks, prompt: aiRequest }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[mapChunks] errore backend:", response.status, errorText);
    return [];
  }

  const data = await response.json();
  const raw = data.result ?? "[]";

  // Step 4: la risposta dell'LLM deve essere un JSON array con dati
  // dalla forma {id, testo}. Se così non fosse scartiamo la risposta
  let toolCalls: { chunkId: string; quote: string }[];
  try {
    toolCalls = JSON.parse(raw);
  } catch {
    console.warn("[mapChunks] risposta LLM non parsabile:", raw);
    return [];
  }

  const newPayloads: any[] = [];

  // Step 5: per ogni porzione di testo indicata dalla risposta,
  // si deve ricostruire il range preciso e trasformarlo in un payload da mandare a saveAnnotation.
  // In questo momento interpreto ogni chunk come un range separato.
  for (const call of toolCalls) {
    const node = chunkMap.get(call.chunkId);
    if (!node) {
      console.warn("[mapChunks] chunkId non trovato:", call.chunkId);
      continue;
    }

    const startOffset = node.textContent?.indexOf(call.quote) ?? -1;
    if (startOffset === -1) {
      console.warn("[mapChunks] quote non trovata nel chunk:", call.quote);
      continue;
    }

    //console.log(call);
    // Con la funzione document.createRange() ricostruisco un Range preciso che corrisponde
    // alla porzione di testo indicata dalla risposta dell'LLM, usando il nodo reale del DOM
    // e l'offset calcolato con indexOf.
    const finalRange = document.createRange();
    finalRange.setStart(node, startOffset);
    finalRange.setEnd(node, startOffset + call.quote.length);

    // Adesso bisogna ricostruire il payload da salvare e da inviare a saveAnnotation,
    // aggiornando subject.selected con il nuovo rangeSelector/textQuoteSelector
    const selected = serializeRangeToSelector(finalRange);
    const newPayload = cloneDeep(annotationPayload);
    newPayload.subject = { ...newPayload.subject, selected };

    newPayloads.push(newPayload);
  }

  return newPayloads;
}

// Questa funzione ricostruisce il Range come oggetto dal DOM usando startContainer xpath del rangeSelector
function restoreRangeFromXPath(selected: any): Range | null {
  const { startContainer, endContainer, startOffset, endOffset } =
    selected.rangeSelector ?? {};
  if (!startContainer || !endContainer) return null;

  try {
    const toRelative = (xpath: string) =>
      xpath.startsWith("/") ? xpath.slice(1) : xpath;

    const startNode = document.evaluate(
      toRelative(startContainer),
      document.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    const endNode = document.evaluate(
      toRelative(endContainer),
      document.body,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    if (!startNode || !endNode) return null;

    const range = document.createRange();
    range.setStart(toTextNode(startNode), startOffset ?? 0);
    range.setEnd(toTextNode(endNode), endOffset ?? 0);
    return range;
  } catch (e) {
    console.warn("[restoreRange] xpath fallito, provo textQuote", e);
    return null;
  }
}

function restoreRangeFromTextQuote(selected: any): Range | null {
  const { exact, prefix } = selected.textQuoteSelector ?? {};
  if (!exact) return null;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const idx = node.textContent?.indexOf(exact) ?? -1;
    if (idx === -1) continue;
    if (
      prefix &&
      !node.textContent?.substring(0, idx).endsWith(prefix.trim())
    ) {
      continue;
    }

    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + exact.length);
    return range;
  }
  return null;
}

function restoreRangeFromPayload(annotationPayload: any): Range | null {
  const selected = annotationPayload?.subject?.selected;
  if (!selected) return null;

  return restoreRangeFromXPath(selected) ?? restoreRangeFromTextQuote(selected);
}
