import { RangeSelector } from '../../entity';

export class RangeSelectorBuilder {
    private _startContainer!: string;

    private _startOffset!: number;

    private _endContainer!: string;

    private _endOffset!: number;

    startContainer = (value: string): RangeSelectorBuilder => {
      this._startContainer = value;
      return this;
    }

    endContainer = (value: string): RangeSelectorBuilder => {
      this._endContainer = value;
      return this;
    }

    startOffset = (value: number): RangeSelectorBuilder => {
      this._startOffset = value;
      return this;
    }

    endOffset = (value: number): RangeSelectorBuilder => {
      this._endOffset = value;
      return this;
    }

    build = (): RangeSelector => ({
      startContainer: this._startContainer,
      startOffset: this._startOffset,
      endContainer: this._endContainer,
      endOffset: this._endOffset,
    });
}
