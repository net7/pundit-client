import { TextQuoteSelector } from '../../entity';

export class TextQuoteSelectorBuilder {
    private _exact!: string;

    private _prefix!: string;

    private _suffix!: string;

    exact = (value: string): TextQuoteSelectorBuilder => {
      this._exact = value;
      return this;
    }

    prefix = (value: string): TextQuoteSelectorBuilder => {
      this._prefix = value;
      return this;
    }

    suffix = (value: string): TextQuoteSelectorBuilder => {
      this._suffix = value;
      return this;
    }

    build = (): TextQuoteSelector => ({
      exact: this._exact,
      prefix: this._prefix,
      suffix: this._suffix
    })
}
