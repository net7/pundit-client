import { OnthologyItem } from 'src/app/components/onthologies-panel/onthologies-panel';
import { sample, sampleSize } from 'lodash';
import { CrossMsgRequestId } from '../types';
import { CrossMessage } from '../cross-message';

const types = ['predicate', 'class', 'entity'];
const categories = ['Connector', 'Original onthology'];

const mock = (): OnthologyItem[] => Array(
  Math.ceil(Math.random() * 10)
).fill(null).map((_, index) => ({
  id: `ont-${index + 1}`,
  label: `Onthology ${index + 1}`,
  types: sampleSize(types, Math.ceil(Math.random() * 3)),
  category: sample(categories),
  selected: sample([true, false])
}));

export class SemanticOnthologiesModel {
  @CrossMessage(CrossMsgRequestId.SemanticOnthologiesGet)
  static get() {
    return new Promise((res) => {
      res({
        status: 200,
        data: mock()
      });
    });
  }

  @CrossMessage(CrossMsgRequestId.SemanticOnthologiesSetSelected)
  static setSelected(selected: string[]) {
    console.warn('FIXME: gestire set selected', selected);
    return new Promise((res) => {
      res({
        status: 200,
      });
    });
  }
}
