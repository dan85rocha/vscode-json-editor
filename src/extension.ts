import { ExtensionContext } from "vscode";
import { CustomJsonEditorProvider } from "./panels/json-editor";

export function activate(context: ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(CustomJsonEditorProvider.register(context));
}