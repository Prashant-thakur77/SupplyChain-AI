import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check finalized strategies
    const { data: finalizedStrategies, error: finalizedError } = await supabase
      .from('finalized_strategies')
      .select('*')
      .order('created_at', { ascending: false })

    // Check regular strategies  
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        finalizedStrategies: {
          count: finalizedStrategies?.length || 0,
          data: finalizedStrategies,
          error: finalizedError
        },
        strategies: {
          count: strategies?.length || 0,
          data: strategies,
          error: strategiesError
        }
      }
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
