import { cloneDeep } from "lodash";

function toTextNode(node: Node): Node {
  if (node.nodeType === Node.TEXT_NODE) return node;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const firstText = walker.nextNode();
  return firstText ?? node;
}

/**
 * Restituisce:
 * - chunks: array di { id, text } da inviare all'LLM
 * - chunkMap: mappa id → nodo Text reale del DOM
 * - chunkPrefixLen: mappa id → numero di caratteri di whitespace
 *   iniziali rimossi (utile se in futuro volessimo fare un trim selettivo)
 */
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
    // NON facciamo trim: il testo viene inviato all'LLM così com'è,
    // in modo che gli offset start/end calcolati dall'LLM corrispondano
    // direttamente agli offset da usare nel nodo DOM reale.
    const text = node.textContent ?? "";
    // Saltiamo chunk vuoti
    if (text.length === 0) {
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

/**
 * Calcola la posizione di un nodo Text nel document.body.textContent,
 * sommando le lunghezze di tutti i text node precedenti nel body.
 */
function getTextOffsetInBody(node: Node): number {
  let offset = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const current = walker.currentNode as Text;
    if (current === node) break;
    offset += current.textContent?.length ?? 0;
  }
  return offset;
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

  // Calcola la posizione reale del testo selezionato nel body,
  // partendo dal nodo specifico (startContainer) e non cercando
  // con indexOf che troverebbe la prima occorrenza nel body.
  const nodeOffset = getTextOffsetInBody(
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer
      : range.startContainer.firstChild!,
  );
  const start = nodeOffset + range.startOffset;
  const end = start + text.length;

  const bodyText = document.body.textContent ?? "";
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
function addPayloadForRange(
  node: Text,
  startIndex: number,
  endIndex: number,
  annotationPayload: any,
  newPayloads: any[],
  annotationType?: string,
  commentText?: string,
  tags?: string[],
): void {
  const finalRange = document.createRange();
  finalRange.setStart(node, startIndex);
  finalRange.setEnd(node, endIndex);

  console.warn("[mapChunks] Serializzando range a selector...");
  const selected = serializeRangeToSelector(finalRange);

  if (!annotationPayload) {
    console.error("[mapChunks] ERRORE: annotationPayload è undefined!");
    return;
  }

  const newPayload = cloneDeep(annotationPayload);
  newPayload.subject = { ...newPayload.subject, selected };

  // Applica annotation_type, commento e tags dalla risposta LLM.
  // L'LLM risponde con: "Highlighting" | "Commenting" | "tag" | "semanticAnnotation"
  if (annotationType === "Commenting" && commentText) {
    newPayload.type = "Commenting";
    newPayload.content = { comment: commentText };
    newPayload.tags = tags && tags.length ? tags : undefined;
  } else if (annotationType === "tag") {
    newPayload.type = "Highlighting";
    newPayload.content = undefined;
    newPayload.tags = tags && tags.length ? tags : undefined;
  } else if (annotationType === "semanticAnnotation") {
    newPayload.type = "Linking";
    newPayload.content = undefined;
    newPayload.tags = tags && tags.length ? tags : undefined;
  } else {
    // "Highlighting" o default
    newPayload.type = "Highlighting";
    newPayload.content = undefined;
    newPayload.tags = tags && tags.length ? tags : undefined;
  }

  newPayloads.push(newPayload);
  logPayloadCreation(newPayloads.length, newPayload);
}

function logPayloadCreation(count: number, payload: any): void {
  console.warn(
    "[mapChunks] Payload creato con successo. Totale:",
    count,
    "- tipo:",
    payload.type,
    "- commento:",
    payload.content?.comment?.substring(0, 50),
    "- tags:",
    payload.tags?.join(", "),
  );
}

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
  // Ho aggiunto un filtro per ipotetiche righe vuote, che non dovrebbero esserci.
  // Importante: all'LLM bisogna mandare il testo senza modifiche, quindi senza trim(), così
  // che il calcolo degli indici coincida con il testo originale
  const filteredChunks = chunks.filter(
    (c) => typeof c.text === "string" && c.text.trim().length > 0,
  );
  if (filteredChunks.length !== chunks.length) {
    console.warn("[mapChunks] removed empty chunks before send", {
      original: chunks.length,
      filtered: filteredChunks.length,
    });
  }
  if (filteredChunks.length === 0) {
    console.warn("[mapChunks] no valid chunks to send");
    return [];
  }

  const response = await fetch(`https://app.thepund.test/ai/annotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
    body: JSON.stringify({ chunks: filteredChunks, prompt: aiRequest }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[mapChunks] errore backend:", response.status, errorText);
    return [];
  }

  const respText = await response.text();
  let data: any;
  try {
    data = respText ? JSON.parse(respText) : {};
  } catch {
    console.error("[mapChunks] backend returned non-JSON response:", respText);
    return [];
  }

  const raw = data.result ?? "[]";

  // Step 4: la risposta del backend è un JSON array con oggetti
  // dalla forma { chunkId, quote, words_counter, annotation_type, comment, tags }.
  let toolCalls: {
    chunkId: string;
    quote: string;
    words_counter: number;
    annotation_type?: string;
    comment?: string;
    tags?: string[];
  }[];

  try {
    toolCalls = Array.isArray(raw) ? raw : JSON.parse(raw);

    console.warn("[mapChunks] risposta LLM parsata:", toolCalls);
  } catch (error) {
    console.warn("[mapChunks] risposta backend non parsabile:", raw, error);
    return [];
  }

  console.warn("[mapChunks] Ricevuti elementi dal backend:", toolCalls.length);

  const newPayloads: any[] = [];

  // Step 5: per ogni elemento, ricostruisce il range preciso nel DOM
  // e lo trasforma in un payload da mandare a saveAnnotation.
  for (const call of toolCalls) {
    try {
      const node = chunkMap.get(call.chunkId);
      if (!node) {
        console.warn("[mapChunks] chunkId non trovato:", call.chunkId);
        continue;
      }

      const quote = call.quote ?? "";
      if (!quote) {
        console.warn("[mapChunks] quote mancante:", call);
        continue;
      }

      const nodeText = node.textContent ?? "";
      const wordCount = call.words_counter ?? 1;
      const annotationType = call.annotation_type;
      if (wordCount > 1) {
        // Caso in cui la stessa parola/frase compare più volte nel chunk
        const starterPositions = positionsSameWords(nodeText, quote);
        console.warn(starterPositions);

        if (starterPositions.length === 0) {
          console.warn("[mapChunks] quote non trovate nel DOM reale:", {
            quote,
            chunkId: call.chunkId,
            nodeText: nodeText.substring(0, 100),
          });
          continue;
        }

        for (let i = 0; i < starterPositions.length; i++) {
          const startIndex = starterPositions[i];
          const endIndex = startIndex + quote.length;
          addPayloadForRange(
            node,
            startIndex,
            endIndex,
            annotationPayload,
            newPayloads,
            annotationType,
            call.comment,
            call.tags,
          );
        }
      } else {
        // Trova la quote nel nodo DOM reale con indexOf
        const startIndex = nodeText.indexOf(quote);
        if (startIndex === -1) {
          console.warn("[mapChunks] quote non trovata nel DOM reale:", {
            quote,
            chunkId: call.chunkId,
            nodeText: nodeText.substring(0, 100),
          });
          continue;
        }
        const endIndex = startIndex + quote.length;
        addPayloadForRange(
          node,
          startIndex,
          endIndex,
          annotationPayload,
          newPayloads,
          annotationType,
          call.comment,
          call.tags,
        );
      }
    } catch (error) {
      console.error(
        "[mapChunks] Errore durante l'elaborazione di un elemento:",
        {
          call,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      continue;
    }
  }

  console.warn(
    "[mapChunks] COMPLETATO - Ritornando",
    newPayloads.length,
    "payload(s)",
  );
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
    // grazie alla funzione document.evaluate() posso ritrovare i nodi reali del DOM a partire
    // dagli xpath salvati nel payload, e quindi ricostruire il range preciso
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

    // Per costruire il range utilizzo la funzione createRange() passando come parametri
    // i nodi reali del DOM trovati tramite la funzione evaluate().
    const range = document.createRange();
    range.setStart(toTextNode(startNode), startOffset ?? 0);
    range.setEnd(toTextNode(endNode), endOffset ?? 0);
    return range;
  } catch (e) {
    console.warn("[restoreRange] xpath fallito, provo textQuote", e);
    return null;
  }
}
// Questa funzione ricostruisce il Range a partire dal testo selezionato
// e viene quindi utilizzata nel caso in cui ci sia un errore nel ritrovare il range tramite xpath
function restoreRangeFromTextQuote(selected: any): Range | null {
  const { exact, prefix } = selected.textQuoteSelector ?? {};
  if (!exact) return null;
  // in questo caso utilizzo un TreeWalker per scansionare il DOM e trovare il nodo
  // che contiene il testo esatto selezionato. Questo potrebbe causare problemi se il testo selezionato
  // è presente in più punti della pagina, ma per ora è una soluzione semplice.
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

// questa funzione mi permette di ritornare gl indici iniziali delle stringhe di parole ripetute in un unico chunk
function positionsSameWords(quote: string, subQuote: string): number[] {
  const secureSubQuote = subQuote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${secureSubQuote}\\b`, "gi");

  return [...quote.matchAll(regex)].map((match) => match.index);
}
