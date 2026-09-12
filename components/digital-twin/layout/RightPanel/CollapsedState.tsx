import { FC, useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import { DeleteIcon } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { panelVariants, iconVariants } from './animations';
import { isNodeElement } from './functions';

interface CollapsedStateProps {
  selectedElement: Node | null;
  formValues: any;
  onExpand: () => void;
  onDelete?: (elementId: string) => void;
}

const CollapsedState: FC<CollapsedStateProps> = ({ 
  selectedElement, 
  formValues, 
  onExpand, 
  onDelete 
}) => {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [shouldSkipConfirmation, setShouldSkipConfirmation] = useState(false);

  // Check cookie on component mount
  useEffect(() => {
    const skipConfirmation = Cookies.get('deleteNodeSkipConfirmation') === 'true';
    setShouldSkipConfirmation(skipConfirmation);
  }, []);

  const handleDelete = () => {
    if (selectedElement && onDelete) {
      // Save preference to cookie if "don't ask again" was checked
      if (dontAskAgain) {
        Cookies.set('deleteNodeSkipConfirmation', 'true', { 
          expires: 365, // 1 year
          path: '/' 
        });
      }
      onDelete(selectedElement.id);
    }
  };

  const handleDirectDelete = () => {
    if (selectedElement && onDelete) {
      onDelete(selectedElement.id);
    }
  };

  const isNode = isNodeElement(selectedElement);

  return (
    <motion.div 
      className="h-full border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shadow-sm overflow-hidden dark:bg-slate-950 lg:relative absolute right-0 top-0 shadow-lg lg:shadow-none z-30"
      variants={panelVariants}
      animate="collapsed"
      initial={false}
    >
      {/* Top spacer to avoid Save button overlap */}
      <div className="h-20 flex-shrink-0"></div>

      {/* Spacer to push content to center and buttons to bottom */}
      <div className="flex-1">
        {/* Vertical text when collapsed - always visible */}
        <motion.div 
          className="h-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div 
            className="whitespace-nowrap text-xs text-muted-foreground font-medium select-none"
            initial={{ 
              rotate: 0,
              opacity: 0 
            }}
            animate={{ 
              rotate: -90,
              opacity: 1 
            }}
            transition={{ 
              duration: 0.5, 
              delay: 0.2,
              ease: "easeInOut"
            }}
          >
            Properties
          </motion.div>
        </motion.div>
      </div>
      
      {/* Delete button when collapsed and element is selected - Above expand button */}
      {selectedElement && isNode && onDelete && (
        <div className="border-t border-border">
          {shouldSkipConfirmation ? (
            <motion.button
              onClick={handleDirectDelete}
              className="w-full p-4 hover:bg-destructive/10 transition-colors group"
              title="Delete Node"
              whileHover={{ backgroundColor: "hsl(var(--destructive) / 0.1)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <DeleteIcon size={20} className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors mx-auto" />
            </motion.button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <motion.button
                  className="w-full p-4 hover:bg-destructive/10 transition-colors group"
                  title="Delete Node"
                  whileHover={{ backgroundColor: "hsl(var(--destructive) / 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <DeleteIcon size={20} className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors mx-auto" />
                </motion.button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Node</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <div>
                      Are you sure you want to delete "{formValues.label || selectedElement.id}"? This action cannot be undone and will also remove all connected edges.
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox 
                        id="dont-ask-again" 
                        checked={dontAskAgain}
                        onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                      />
                      <label 
                        htmlFor="dont-ask-again" 
                        className="text-sm text-muted-foreground cursor-pointer select-none"
                      >
                        Don't ask again
                      </label>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
      
      {/* Expand button fixed at bottom */}
      <div className="border-t border-border">
        <motion.button
          onClick={onExpand}
          className="w-full p-4 hover:bg-accent transition-colors group"
          title="Expand Properties Panel"
          whileHover={{ backgroundColor: "hsl(var(--accent))" }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            variants={iconVariants}
            animate="collapsed"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mx-auto" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CollapsedState; 