import { supabaseClient } from "@/lib/supabase/client";
import parseProductSheet from "./parseProductSheet";
import { toast } from "sonner";

interface ProductData {
    'Product ID': string;
    'Name': string;
    'Quantity': number;
    'Price': number;
    'Category': string;
    'Weight (kg)': number;
}

interface NodeReference {
    nodeId: string;
    nodeType: string;
    nodeLabel: string;
}

interface ProductInventory {
    nodeReference: NodeReference;
    products: ProductData[];
}

/**
 * Processes product sheets attached to warehouse or distribution nodes
 * @param {Array} nodes - Array of nodes in the supply chain
 * @returns {Promise<{nodes: Array, productInventories: ProductInventory[]}>} - Processed nodes and separate product inventories
 */
async function processProductSheets(nodes: any[]) {

    const productInventories: ProductInventory[] = [];

    console.log("Processing product sheets...");

    // Process each node
    const processedNodes = await Promise.all(
        nodes.map(async (node) => {
            // Only process warehouse or distribution nodes with attached files
            if ((node.data.type === 'Warehouse' || node.data.type === 'Distribution') &&
                node.data.attachedFile) {

                try {
                    // Get the file from the node data
                    const fileData = node.data.attachedFile;

                    if (fileData && fileData.fileObject) {
                        // Parse the Excel sheet
                        const products = await parseProductSheet(fileData.fileObject);
                        console.log("Parsed products:", products);

                        // Create a reference to the node
                        const nodeReference: NodeReference = {
                            nodeId: node.id,
                            nodeType: node.data.type,
                            nodeLabel: node.data.label || 'Unnamed Node'
                        };

                        // Store in the separate product inventories array
                        productInventories.push({
                            nodeReference,
                            products
                        });

                        // Return node with just a reference to having product data
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                hasProductInventory: true
                            }
                        };
                    }
                } catch (error) {
                    console.error(`Error processing product sheet for node ${node.id}:`, error);
                }
            }

            // Return node unchanged if it's not a warehouse/distribution or has no file
            return node;
        })
    );
    console.log("Processed nodes:", processedNodes);

    return { nodes: processedNodes, productInventories };
}

/**
 * Inserts a supply chain into Supabase.
 * @param {Object} data - The full supply chain object
 * @returns {Promise<{ success: boolean, data?: any, error?: any }>}
 */
async function insertSupplyChain(data: any) {
    try {
        const {
            name,
            description = "",
            nodes,
            edges,
            connections,
            organisation,
        } = data;

        // Process any product sheets in warehouse or distribution nodes
        const { nodes: processedNodes, productInventories } = await processProductSheets(nodes);
        console.log("Processed nodes with product inventories:", processedNodes, productInventories);

        const payload = {
            user_id: organisation.id,
            name,
            description,
            nodes: processedNodes,
            edges,
            connections,
            organisation,
            productInventories, // Store product data in a separate column
        };

        // if (payload) {
        //     console.log("Inserting supply chain:", payload);
        //     toast.success("Supply chain data is ready to be inserted into Supabase.");
        //     return { success: true, data: payload };
        // }

        const { data: result, error } = await supabaseClient
            .from("supply_chains")
            .insert([payload])
            .select();

        if (error) {
            console.error("❌ Supabase insert error:", error);
            return { success: false, error };
        }

        return { success: true, data: result };
    } catch (err) {
        console.error("❌ Unexpected error:", err);
        return { success: false, error: err };
    }
}

export default insertSupplyChain;