import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { supabaseServer } from "@/lib/supabase/server";
import { AI_MODELS, getAIKeyForModule } from "@/lib/ai-config";



export async function GET(request: Request) {
    try {
        const supabase = supabaseServer;

        // Fetch the supply_chain_intel table
        console.log("Fetching the supply chain_intel table...");
        const { data: supplyChainIntel } = await supabase
            .from("supply_chain_intel")
            .select("*");

        if (!supplyChainIntel || supplyChainIntel.length === 0) {
            return NextResponse.json({ message: "No supply chain intel found" }, { status: 404 });
        }

        // Process each item in the supply chain intel
        const processedItems = await Promise.all(supplyChainIntel.map(async (item) => {
            // Extract news data
            const newsData = item.news || [];

            // Process each news item
            const processedNews = await Promise.all(newsData.map(async (news: any) => {
                const summary = news.summary;
                const date = news.time;

                // Use generateText to analyze the news and get sources
                console.log(`Analyzing news: ${summary}`);

                const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
                const { text, sources } = await generateText({
                    model: google(AI_MODELS.agents, {
                        useSearchGrounding: true,
                    }),
                    prompt: `Analyze this supply chain news: "${summary}" from date ${date}. 
                    What are the potential impacts and what might be the original sources of this information?
                    Provide a concise analysis.`,
                });

                // Log the sources for each news item
                console.log('Sources for news:', sources);

                // Update the news item with analysis and sources
                const updatedNews = {
                    ...news,
                    date,
                    summary,
                    analysis: text,
                    generatedSources: sources,
                };

                return updatedNews;
            }));

            // console.log("Processed news:", processedNews);
            // Update the database with the processed news that now includes sources
            await supabase
                .from("supply_chain_intel")
                .update({ news: processedNews })
                .eq("intel_id", item.intel_id);

            // Return processed item for the response
            return {
                intel_id: item.intel_id,
                node_id: item.node_id,
                created_at: item.created_at,
                processed_news: processedNews,
            };
        }));

        return NextResponse.json(processedItems);
    } catch (error) {
        console.error('Error processing notifications:', error);
        return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 });
    }
}


