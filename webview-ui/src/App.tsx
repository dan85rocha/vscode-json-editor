import { vscode } from "./utilities/vscode";
import { useCallback, useEffect, useState } from 'react'
import JSONEditor from "./components/jsoneditor";
import { Content, OnChangeStatus, toTextContent, toJSONContent} from 'vanilla-jsoneditor';
import "./App.css";

function App() {

  const _state: any = vscode.getState();
  let _initialValue = { text: "{}" };
  if (_state) { _initialValue = toTextContent(_state, 2) }
  const [jsonContent, setJsonContent] = useState<any>(_initialValue);
  const isTable = Array.isArray(toJSONContent(jsonContent).json);
  const [editMode, setEditMode] = useState<string>(isTable ? 'table' : 'tree')

  useEffect(() => {
    setEditMode(isTable ? 'table' : 'tree');
  }, [isTable])

  const handler = useCallback(
    (content: Content, previousContent: Content, status: OnChangeStatus) => {
      const newContent = { text: toTextContent(content, 2).text };
      if (status.patchResult) {
        // keep react state updated
        setJsonContent(newContent);
        // update the vscode state
        vscode.setState(newContent);
        // tell vscode to update the content of the document
        vscode.postMessage({
          type: "update-from-webview",
          ...newContent
        });
      }
    }, [jsonContent])

  const modeHandler = useCallback((mode) => {
    setEditMode(mode);
  }, [editMode])

  useEffect(() => {
    // Webviews are normally torn down when not visible and re-created when they become visible again.
    // State lets us save information across these re-loads
    const state: any = vscode.getState();
    if (state) {
      setJsonContent({ text: state.text })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'update-from-document':
          const text = message.text;
          const state: any = vscode.getState();
          if (text !== state?.text) {
            console.log("Content from document is different, reloading editor data...", state);
            // update our webview content
            setJsonContent({ text });
            // then persist state information
            // This state is returned in the call to `vscode.getState` below when a webview is reloaded
            vscode.setState({ text });
          }
      }
    });
  }, [])

  return (
    <main>
      <JSONEditor 
        content={jsonContent} 
        onChange={handler}
        indentation={2}
        mode={editMode}
        onChangeMode={modeHandler}
      />
    </main>
  );
}

export default App;
