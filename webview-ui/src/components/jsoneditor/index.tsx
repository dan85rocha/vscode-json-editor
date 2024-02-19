import { JSONEditor } from "vanilla-jsoneditor";
import { useEffect, useRef } from "react";
import "./style.css";
import "./dark.css";

export default function SvelteJSONEditor(props: any) {
  const refContainer = useRef(null);
  const refEditor = useRef(null);

  useEffect(() => {
    //@ts-ignore: will review later
    refEditor.current = new JSONEditor({
      //@ts-ignore: will review later
      target: refContainer.current,
      props: {
        onRenderMenu: (items: any, context: any) => {
          items.shift();
          items[0].className += " jse-first";
          return items
        }
      }
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        //@ts-ignore: will review later
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      //@ts-ignore: will review later
      refEditor.current.updateProps(props);
    }
  }, [props]);
  
  return (
    <div className="svelte-jsoneditor-react jse-theme-dark" ref={refContainer} />
  );
}
