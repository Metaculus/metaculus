import { JsxComponentDescriptor, MdastJsx } from "@mdxeditor/editor";
import { FC, type Attributes } from "react";

function createEditorComponent<P extends Record<string, unknown>>(
  Component: FC<P>
): JsxComponentDescriptor["Editor"] {
  const Editor: JsxComponentDescriptor["Editor"] = ({
    mdastNode,
    descriptor,
  }) => {
    const componentProps = extractComponentProps<P>(mdastNode, descriptor);
    return <Component {...(componentProps as P & Attributes)} />;
  };
  Editor.displayName = "EditorComponent";

  return Editor;
}

type Primitive = string | number | boolean | null | undefined;

function extractComponentProps<
  P extends Record<string, unknown> = Record<string, unknown>,
>(node: MdastJsx, descriptor: JsxComponentDescriptor): P {
  const props: Record<string, Primitive> = {};
  for (const attribute of node.attributes) {
    if (attribute.type === "mdxJsxAttribute") {
      const propDescriptor = descriptor.props.find(
        (prop) => prop.name === attribute.name
      );
      if (!propDescriptor) continue;

      if (propDescriptor.type === "number") {
        props[attribute.name] = Number(attribute.value);
      } else {
        props[attribute.name] = attribute.value as Primitive;
      }
    }
  }

  return props as unknown as P;
}

export default createEditorComponent;
