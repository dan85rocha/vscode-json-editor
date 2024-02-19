import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

/**
 * Provider for JSON Editors.
 * 
 * JSON Editors are used for `.json` files, which are just json files.
 * To get started, run this extension and open an empty `.json` file in VS Code.
 * 
 * This provider is responsible for:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class CustomJsonEditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new CustomJsonEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(CustomJsonEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'custom.jsonEditor';

	constructor(private readonly context: vscode.ExtensionContext) {}

	/**
	 * Called when our custom editor is opened.
	 * 
	 * 
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

        webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);

		function updateWebview() {
			webviewPanel.webview.postMessage({
				type: 'update-from-document',
				text: document.getText()
			});
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview();
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(event => {
			console.log("Received message from webview", event);
			switch (event.type) {
				case 'update-from-webview':
					this._updateTextDocument(document, event.text);
			}
            // Implement functions to update the document
            // Use getDocumentAsJson and updateTextDocument to complete the action
		});

		console.log("updateWebView initial trigger");
		updateWebview();
	}

    /**
    * Defines and returns the HTML that should be rendered within the webview panel.
    *
    * @remarks This is also the place where references to the React webview build files
    * are created and inserted into the webview HTML.
    *
    * @param webview A reference to the extension webview
    * @returns A template string literal containing the HTML that should be
    * rendered within the webview panel
    */
    private _getWebviewContent(webview: vscode.Webview): string {
        // The CSS file from the React build output
        const stylesUri = getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        // The JS file from the React build output
        const scriptUri = getUri(webview, this.context.extensionUri, ["webview-ui", "build", "assets", "index.js"]);

        const nonce = getNonce();

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Hello World</title>
            </head>
            <body>
            <div id="root"></div>
            <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
        </html>
        `;
    }

	/**
	 * Write out to a given document.
	 */
	private _updateTextDocument(document: vscode.TextDocument, text: string) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			text);

		return vscode.workspace.applyEdit(edit);
	}
}
