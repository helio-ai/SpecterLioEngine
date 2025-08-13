import { BaseTool, ToolResult, ToolMetadata } from '../core/base-tool';
// import { agentLogger } from '../../shared/utils/agent.logger';
import { googleConfig } from '../../core/config/agent.config';

interface BookResult {
  title: string;
  authors: string[];
  link: string;
  description?: string;
  publishedDate?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
}

interface BookSearchInput {
  query: string;
  maxResults?: number;
  language?: string;
  orderBy?: 'relevance' | 'newest';
}

export class BooksTool extends BaseTool {
  constructor() {
    const metadata: ToolMetadata = {
      name: 'searchBooks',
      description:
        'Search for books using Google Books API. Use this when users ask about books, authors, or reading recommendations. Supports filtering by language, ordering, and result limits.',
      version: '1.0.0',
      category: 'search',
      tags: ['books', 'search', 'reading', 'recommendations'],
      rateLimit: {
        requests: 100,
        window: 3600, // 1 hour
      },
      timeout: 10000,
    };

    super(metadata, {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      cacheEnabled: true,
      cacheTTL: 1800000, // 30 minutes
    });

    console.log('📚 [BOOKS-TOOL] Initialized with metadata:', {
      name: metadata.name,
      category: metadata.category,
      version: metadata.version,
      description: metadata.description.substring(0, 50) + '...',
    });
  }

  async execute(input: BookSearchInput): Promise<ToolResult<BookResult[]>> {
    const startTime = Date.now();

    try {
      // minimal function-level logging only

      const { query, maxResults = 5, language = 'en', orderBy = 'relevance' } = input;

      if (!query || query.trim().length === 0) {
        console.log('❌ [BOOKS-TOOL] Query is required');
        return {
          success: false,
          error: 'Query is required',
        };
      }

      const params = new URLSearchParams({
        q: query.trim(),
        maxResults: maxResults.toString(),
        langRestrict: language,
        orderBy,
        key: googleConfig.apiKey || '',
      });

      const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
      console.log('🌐 [BOOKS-TOOL] Making API request to Google Books:', {
        url: url.substring(0, 100) + '...',
        hasApiKey: !!googleConfig.apiKey,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.log('❌ [BOOKS-TOOL] Google Books API error:', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ [BOOKS-TOOL] API response received, parsing JSON...');
      const data = (await response.json()) as {
        items?: {
          id: string;
          volumeInfo: {
            title: string;
            authors?: string[];
            infoLink: string;
            description?: string;
            publishedDate?: string;
            industryIdentifiers?: Array<{
              type: string;
              identifier: string;
            }>;
            pageCount?: number;
            categories?: string[];
            averageRating?: number;
            ratingsCount?: number;
          };
        }[];
        totalItems?: number;
      };

      console.log('📊 [BOOKS-TOOL] Parsed response data:', {
        totalItems: data.totalItems,
        itemsCount: data.items?.length || 0,
      });

      const results: BookResult[] = (data.items || []).map((book) => ({
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors || ['Unknown Author'],
        link: book.volumeInfo.infoLink,
        description: book.volumeInfo.description,
        publishedDate: book.volumeInfo.publishedDate,
        isbn: this.extractISBN(book.volumeInfo.industryIdentifiers),
        pageCount: book.volumeInfo.pageCount,
        categories: book.volumeInfo.categories,
        averageRating: book.volumeInfo.averageRating,
        ratingsCount: book.volumeInfo.ratingsCount,
      }));

      const responseTime = Date.now() - startTime;
      console.log('✅ [BOOKS-TOOL] Book search completed successfully:', {
        query,
        resultsCount: results.length,
        totalItems: data.totalItems,
        responseTime: `${responseTime}ms`,
        results: results.map((book) => ({
          title: book.title,
          authors: book.authors,
          averageRating: book.averageRating,
        })),
      });

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.log('❌ [BOOKS-TOOL] Book search failed:', {
        query: input.query,
        error: error.message,
        responseTime: `${responseTime}ms`,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private extractISBN(
    identifiers?: Array<{ type: string; identifier: string }>,
  ): string | undefined {
    if (!identifiers) return undefined;

    const isbn = identifiers.find((id) => id.type === 'ISBN_13' || id.type === 'ISBN_10');

    return isbn?.identifier;
  }

  public getEnhancedDescription(): string {
    return `${this.metadata.description}

Available parameters:
- query (required): Search term for books
- maxResults (optional): Number of results (1-40, default: 5)
- language (optional): Language code (e.g., 'en', 'es', 'fr', default: 'en')
- orderBy (optional): Sort order ('relevance' or 'newest', default: 'relevance')

Example usage:
{
  "query": "machine learning",
  "maxResults": 10,
  "language": "en",
  "orderBy": "relevance"
}`;
  }

  public override getOpenAIFunctionSpec() {
    return {
      type: 'function',
      function: {
        name: this.getMetadata().name,
        description: this.getEnhancedDescription(),
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search term for books' },
            maxResults: { type: 'number', minimum: 1, maximum: 40 },
            language: { type: 'string' },
            orderBy: {
              type: 'string',
              enum: ['relevance', 'newest'],
              default: 'relevance',
            },
          },
          required: ['query'],
          additionalProperties: false,
        },
      },
    } as const;
  }
}
