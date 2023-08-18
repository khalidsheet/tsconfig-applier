import * as vscode from "vscode";
import { checkUserTokenOrRun, showBaseList } from "./tsconfig-applier";
import { TOKEN_KEY } from "./constants";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "tsconfig-applier.tsconfigApplier",
    () => {
      checkUserTokenOrRun(context);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  context.globalState.update(TOKEN_KEY, undefined);
}
