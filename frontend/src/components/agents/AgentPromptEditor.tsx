import React from "react";
import AdvancedPromptEditor from "./AdvancedPromptEditor";
import { CreateAgentFormData } from "@/types/agent";

interface AgentPromptEditorProps {
  formData: CreateAgentFormData;
  setFormData: (data: CreateAgentFormData) => void;
}

const AgentPromptEditor: React.FC<AgentPromptEditorProps> = ({
  formData,
  setFormData,
}) => {
  return (
    <div className="space-y-4">
      <AdvancedPromptEditor formData={formData} setFormData={setFormData} />
    </div>
  );
};

export default AgentPromptEditor;