import { NotebookAttributes, SharingModeType } from '../../entity';

export class NotebookBuilder {
    private _label!: string;

    private _userId!: string;

    private _sharingMode!: SharingModeType;

    private _userWithReadAccess?: string[];

    private _userWithWriteAccess?: string[];

    label(label: string): NotebookBuilder {
      this._label = label;
      return this;
    }

    userId(userId: string): NotebookBuilder {
      this._userId = userId;
      return this;
    }

    sharingMode(sharingMode: SharingModeType, userWithReadAccess: string[],
      userWithWriteAccess: string[]) {
      if (sharingMode === 'private') {
        this._userWithReadAccess = undefined;
        this._userWithWriteAccess = undefined;
      } else if (sharingMode === 'public') {
        this._userWithReadAccess = undefined;
        this._userWithWriteAccess = undefined;
      } else {
        this._userWithReadAccess = userWithReadAccess;
        this._userWithWriteAccess = userWithWriteAccess;
      }
      this._sharingMode = sharingMode;
      return this;
    }

    build = (): NotebookAttributes => ({
      label: this._label,
      userId: this._userId,
      sharingMode: this._sharingMode,
      userWithReadAccess: this._userWithReadAccess,
      userWithWriteAccess: this._userWithWriteAccess
    })
}
