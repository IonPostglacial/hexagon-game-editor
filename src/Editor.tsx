import "./Editor.css";
import MapEditor from "./components/MapEditor";

function Editor() {
  return (
    <MapEditor initialWidth={24} initialHeight={12} initialRadius={32}></MapEditor>
  )
}

export default Editor
