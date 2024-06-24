import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";

const NotebookCreator: React.FC = ({}) => {
  return (
    <div className="h-50vh mx-auto mb-8 mt-4 max-w-3xl overflow-auto rounded-lg bg-gray-0 p-6 dark:bg-gray-100-dark">
      <div className="mt-4 pl-2 text-2xl">Title</div>
      <div className="m-2  mb-4">
        <input type="text" className="w-full max-w-[600px] p-1 text-xl" />
      </div>
      <div className="pl-2">
        <MarkdownEditor markdown={""} inlineJsxEmbeds />
      </div>
      <div className="pl-2">
        <Button className="text-xl">Create Notebook</Button>
      </div>
    </div>
  );
};

export default NotebookCreator;
