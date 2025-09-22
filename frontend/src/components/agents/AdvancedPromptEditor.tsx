import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateAgentFormData, Agent } from "@/types/agent";
import { ToolListItem } from "@/types/plugin";
import { getPluginList } from "@/lib/plugin-api";
import { getPublishedAgents } from "@/lib/agent-api";
import { 
  Code, 
  Bot, 
  Wrench, 
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AdvancedPromptEditorProps {
  formData: CreateAgentFormData;
  setFormData: (data: CreateAgentFormData) => void;
}

interface AutoCompleteItem {
  type: 'agent' | 'tool';
  name: string;
  displayName: string;
  description?: string;
  id: string;
}

interface GroupedAutoCompleteItems {
  agents: AutoCompleteItem[];
  tools: AutoCompleteItem[];
}

// 光标位置计算函数
const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
  console.log('计算光标位置，position:', position);
  
  // 创建canvas用于测量文本
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    console.log('无法获取canvas context，使用降级方案');
    const rect = element.getBoundingClientRect();
    return { top: rect.top + 20, left: rect.left + 10 };
  }

  // 复制textarea的字体样式到canvas
  const computedStyle = window.getComputedStyle(element);
  context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  
  const text = element.value;
  const textBeforePosition = text.substring(0, position);
  
  // 分析文本，计算行数和当前行的字符位置
  const lines = textBeforePosition.split('\n');
  const currentLineIndex = lines.length - 1;
  const currentLineText = lines[currentLineIndex];
  
  console.log('当前行索引:', currentLineIndex, '当前行文本:', currentLineText);
  
  // 计算当前行文本的宽度
  const textWidth = context.measureText(currentLineText).width;
  
  // 获取textarea的位置和样式
  const rect = element.getBoundingClientRect();
  const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
  const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
  const lineHeight = parseInt(computedStyle.lineHeight, 10) || 20;
  
  // 计算光标的绝对位置
  const left = rect.left + paddingLeft + textWidth;
  const top = rect.top + paddingTop + (currentLineIndex * lineHeight);
  
  console.log('计算结果 - left:', left, 'top:', top);
  
  // 降级方案：如果计算结果不合理，使用简单的位置
  if (isNaN(left) || isNaN(top) || left < rect.left || top < rect.top) {
    console.log('使用降级方案');
    return { 
      top: rect.top + paddingTop + 20, 
      left: rect.left + paddingLeft + 10 
    };
  }
  
  return { top, left };
};

const AdvancedPromptEditor: React.FC<AdvancedPromptEditorProps> = ({
  formData,
  setFormData,
}) => {
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableTools, setAvailableTools] = useState<ToolListItem[]>([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [groupedItems, setGroupedItems] = useState<GroupedAutoCompleteItems>({ agents: [], tools: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [popupCoordinates, setPopupCoordinates] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // 获取所有项目的平铺数组（用于键盘导航）
  const getAllItems = (): AutoCompleteItem[] => {
    return [...groupedItems.agents, ...groupedItems.tools];
  };

  // 计算弹窗位置
  useEffect(() => {
    if (!textareaRef.current || !showAutoComplete) return;

    const textarea = textareaRef.current;
    console.log('开始计算AdvancedPromptEditor弹窗位置');
    
    try {
      const coords = getCaretCoordinates(textarea, cursorPosition);
      console.log('获得光标坐标:', coords);
      
      const { top: coordTop, left } = coords;
      const top = coordTop + 25; // 弹窗显示在光标下方
      
      console.log('最终弹窗坐标:', { top, left });
      setPopupCoordinates({ top, left });
      
    } catch (error) {
      console.error('弹窗位置计算错误:', error);
      // 降级方案：显示在textarea下方
      const rect = textarea.getBoundingClientRect();
      setPopupCoordinates({ 
        top: rect.bottom + 5, 
        left: rect.left 
      });
    }
  }, [cursorPosition, showAutoComplete]);
  
  // 加载智能体和工具数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tools, agents] = await Promise.all([
          getPluginList(),
          getPublishedAgents()
        ]);
        
        setAvailableTools(tools.filter(tool => tool.isActive));
        setAvailableAgents(agents);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setFormData({ ...formData, prompt: newValue });
    setCursorPosition(cursorPos);
    
    // 检查是否需要显示自动补全
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\{\{\s*([^}]*)$/);
    
    if (match) {
      const query = match[1].toLowerCase();
      const agents: AutoCompleteItem[] = [];
      const tools: AutoCompleteItem[] = [];
      
      // 添加匹配的智能体
      availableAgents.forEach(agent => {
        if (agent.name.toLowerCase().includes(query)) {
          agents.push({
            type: 'agent',
            name: `agent.${agent.name}`,
            displayName: agent.name,
            description: agent.description,
            id: `agent-${agent._id}`
          });
        }
      });
      
      // 添加匹配的工具
      availableTools.forEach(tool => {
        const toolName = tool.name['zh-CN'] || tool.name.en;
        if (toolName.toLowerCase().includes(query)) {
          tools.push({
            type: 'tool',
            name: `tool.${toolName}`,
            displayName: toolName,
            description: tool.description?.['zh-CN'] || tool.description?.en,
            id: `tool-${tool.id}`
          });
        }
      });
      
      setGroupedItems({ agents, tools });
      setShowAutoComplete((agents || []).length > 0 || (tools || []).length > 0);
      setSelectedIndex(0);
    } else {
      setShowAutoComplete(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutoComplete) {
      const allItems = getAllItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertAutoComplete(allItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowAutoComplete(false);
      }
    }
  };

  // 插入自动补全
  const insertAutoComplete = (item: AutoCompleteItem) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // 找到 {{ 的位置
    const textBeforeCursor = text.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\{\{\s*([^}]*)$/);
    
    if (match) {
      const startPos = cursorPos - match[0].length + 2; // +2 for {{
      const newText = text.substring(0, startPos) + ` ${item.name} }}` + text.substring(cursorPos);
      
      setFormData({ ...formData, prompt: newText });
      setShowAutoComplete(false);
      
      // 设置光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = startPos + item.name.length + 3; // +3 for space and }}
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // 插入模板
  const insertTemplate = (template: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + template + text.substring(end);
    setFormData({ ...formData, prompt: newText });
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + template.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // 渲染自动补全项目
  const renderAutoCompleteItems = () => {
    const allItems = getAllItems();
    let currentIndex = 0;

    return (
      <div className="max-h-80 overflow-y-auto">
        {/* 智能体分组 */}
        {(groupedItems.agents || []).length > 0 && (
          <div>
            <div className="px-3 py-2 bg-blue-50 border-b text-sm font-medium text-blue-700 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              智能体 ({(groupedItems.agents || []).length})
            </div>
            {(groupedItems.agents || []).map((item) => {
              const isSelected = currentIndex === selectedIndex;
              const itemIndex = currentIndex++;
              return (
                <div
                  key={item.id}
                  className={`p-3 cursor-pointer border-b ${
                    isSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => insertAutoComplete(item)}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{item.displayName}</span>
                    <Badge variant="default" className="text-xs">
                      智能体
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 工具分组 */}
        {(groupedItems.tools || []).length > 0 && (
          <div>
            <div className="px-3 py-2 bg-green-50 border-b text-sm font-medium text-green-700 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              工具 ({(groupedItems.tools || []).length})
            </div>
            {(groupedItems.tools || []).map((item) => {
              const isSelected = currentIndex === selectedIndex;
              const itemIndex = currentIndex++;
              return (
                <div
                  key={item.id}
                  className={`p-3 cursor-pointer border-b last:border-b-0 ${
                    isSelected ? 'bg-green-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => insertAutoComplete(item)}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{item.displayName}</span>
                    <Badge variant="secondary" className="text-xs">
                      工具
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          高级提示词编辑器
          <Badge variant="secondary">Jinja语法</Badge>
        </CardTitle>
        
        {/* 工具栏 */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('{{ agent_name }}')}
          >
            <Bot className="h-4 w-4 mr-1" />
            智能体引用
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('{{ tool_name }}')}
          >
            <Wrench className="h-4 w-4 mr-1" />
            工具引用
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('{% if condition %}\n内容\n{% endif %}')}
          >
            条件语句
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTemplate('{% for item in items %}\n{{ item }}\n{% endfor %}')}
          >
            循环语句
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? '收起' : '展开'}
          </Button>
        </div>
      </CardHeader>
      

      <CardContent>
        {/* 编辑器容器 */}
        <div className="relative" ref={editorRef}>
          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={formData.prompt}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className={`w-full ${isExpanded ? 'min-h-[500px]' : 'min-h-[300px]'} p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none`}
            placeholder="请输入提示词，使用 {{ }} 引用智能体和工具..."
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }}
          />
          
          {/* 自动补全弹窗 */}
          {showAutoComplete && (
            <Card 
              className="fixed z-30 w-80 shadow-lg border"
              style={{
                top: `${popupCoordinates.top}px`,
                left: `${popupCoordinates.left}px`,
              }}
            >
              <CardContent className="p-0">
                {renderAutoCompleteItems()}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedPromptEditor;