import * as generator from './grammar_generator';
import * as parser from './grammar_parser';

// Export in the same namespace all different symbols exported in library
export let parse = parser.parse;
export let generate = generator.generate;
export let ParserSyntaxError = parser.SyntaxError;
