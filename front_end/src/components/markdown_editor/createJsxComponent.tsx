import { JsxComponentDescriptor, MdastJsx } from "@mdxeditor/editor";
import { FC } from "react";

function createEditorComponent<P>(
  Component: FC<any>
): JsxComponentDescriptor["Editor"] {
  const Editor: JsxComponentDescriptor["Editor"] = ({
    mdastNode,
    descriptor,
  }) => {
    const componentProps = extractComponentProps<P>(mdastNode, descriptor);
    return <Component {...componentProps} />;
  };
  Editor.displayName = "EditorComponent";

  return Editor;
}

function extractComponentProps<P = Record<string, any>>(
  node: MdastJsx,
  descriptor: JsxComponentDescriptor
): P {
  const props: Record<string, any> = {};
  for (const attribute of node.attributes) {
    if (attribute.type === "mdxJsxAttribute") {
      const propDescriptor = descriptor.props.find(
        (prop) => prop.name === attribute.name
      );
      if (!propDescriptor) {
        continue;
      }

      if (propDescriptor.type === "number") {
        props[attribute.name] = Number(attribute.value);
      } else {
        props[attribute.name] = attribute.value;
      }
    }
  }

  return props as P;
}

export default createEditorComponent;
