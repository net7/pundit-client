class ConnectionManagerSingleton {
  private static instance: ConnectionManagerSingleton;

  private _ssoLoading$!: Promise<any>;

  private constructor() { }

  public static getInstance(): ConnectionManagerSingleton {
    if (!ConnectionManagerSingleton.instance) {
      ConnectionManagerSingleton.instance = new ConnectionManagerSingleton();
    }

    return ConnectionManagerSingleton.instance;
  }

  public get ssoLoading$(): Promise<any> {
    return this._ssoLoading$;
  }

  public set ssoLoading$(value: Promise<any>) {
    this._ssoLoading$ = value;
  }
}
export const ConnectionManager = ConnectionManagerSingleton.getInstance();
