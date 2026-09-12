import { FC } from 'react';
import { Node } from 'reactflow';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Blocks, FileText, Hash, Users } from 'lucide-react';

interface TemplateGroupConfigurationProps {
  node: Node;
  nodes: Node[];
}

const TemplateGroupConfiguration: FC<TemplateGroupConfigurationProps> = ({ node, nodes }) => {
  const childNodesCount = nodes.filter(n => n.parentId === node.id).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header Card */}
      <Card className="shadow-md border-l-4 border-l-blue-500 dark:bg-gray-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Blocks className="h-5 w-5 text-blue-500" />
            <span>Template Group</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Template Name</label>
              </div>
              <div className="text-base font-semibold text-foreground bg-muted/30 px-2.5 py-1.5 rounded-md">
                {node.data.label}
              </div>
            </div>
            
            {node.data.description && (
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                </div>
                <div className="text-sm text-muted-foreground font-sm bg-muted/20 px-2.5 py-1.5 rounded-md ">
                  {node.data.description}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Child Nodes</label>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {childNodesCount} nodes
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Group Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <motion.div 
              whileHover={{ x: 4 }}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm">🖱️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Drag to Move</div>
                <div className="text-xs text-muted-foreground">Move entire template group</div>
              </div>
            </motion.div>
            
            <Separator />
            
            <motion.div 
              whileHover={{ x: 4 }}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-sm">⚡</span>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Double-click</div>
                <div className="text-xs text-muted-foreground">Ungroup template nodes</div>
              </div>
            </motion.div>
            
            <Separator />
            
            <motion.div 
              whileHover={{ x: 4 }}
              className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                <kbd className="text-purple-600 text-xs font-bold">U</kbd>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Keyboard Shortcut</div>
                <div className="text-xs text-muted-foreground">Ungroup selected nodes</div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TemplateGroupConfiguration; 