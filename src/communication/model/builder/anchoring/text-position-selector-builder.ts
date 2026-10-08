import { TextPositionSelector } from '../../entity';

export class TextPositionSelectorBuilder {
    private _start!: number;

    private _end!: number;

    start = (value: number): TextPositionSelectorBuilder => {
      this._start = value;
      return this;
    }

    end = (value: number): TextPositionSelectorBuilder => {
      this._end = value;
      return this;
    }

    build = (): TextPositionSelector => ({
      start: this._start,
      end: this._end
    })
}
