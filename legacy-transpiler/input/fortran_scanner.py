"""
Purpose: Legacy-to-Logic Transpiler - Input Stage (Fortran/ALGOL/Assembly scanner)
Dependencies: Python 3.8+, ply (lex/yacc)
Module Role: Scans ancient mainframe code from 1970s
"""

import re
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class CodeToken:
    """Token from scanned code"""
    type: str
    value: str
    line: int
    column: int

class FortranScanner:
    """Scanner for Fortran code"""
    
    def __init__(self):
        # Fortran keywords
        self.keywords = {
            'PROGRAM', 'SUBROUTINE', 'FUNCTION', 'END', 'IF', 'THEN', 'ELSE',
            'DO', 'CONTINUE', 'RETURN', 'INTEGER', 'REAL', 'DOUBLE', 'PRECISION',
            'CHARACTER', 'LOGICAL', 'DIMENSION', 'COMMON', 'DATA', 'EQUIVALENCE'
        }
        
        # Token patterns
        self.patterns = [
            (r'\d+\.\d*', 'FLOAT'),
            (r'\d+', 'INTEGER'),
            (r'[A-Z][A-Z0-9]*', 'IDENTIFIER'),
            (r'\+', 'PLUS'),
            (r'-', 'MINUS'),
            (r'\*', 'MULTIPLY'),
            (r'/', 'DIVIDE'),
            (r'=', 'ASSIGN'),
            (r'\(', 'LPAREN'),
            (r'\)', 'RPAREN'),
            (r',', 'COMMA'),
            (r'\.EQ\.', 'EQUAL'),
            (r'\.NE\.', 'NOTEQUAL'),
            (r'\.LT\.', 'LESSTHAN'),
            (r'\.GT\.', 'GREATERTHAN'),
        ]
    
    def scan(self, source_code: str) -> List[CodeToken]:
        """Scan Fortran source code and return tokens"""
        tokens = []
        lines = source_code.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Remove comments (Fortran comments start with C or *)
            if line.strip().startswith('C') or line.strip().startswith('*'):
                continue
            
            # Remove line numbers (first 6 columns in fixed-format Fortran)
            if len(line) > 6:
                line = line[6:]
            
            column = 1
            for pattern, token_type in self.patterns:
                for match in re.finditer(pattern, line):
                    value = match.group()
                    
                    # Check if identifier is a keyword
                    if token_type == 'IDENTIFIER' and value.upper() in self.keywords:
                        token_type = 'KEYWORD'
                    
                    tokens.append(CodeToken(
                        type=token_type,
                        value=value,
                        line=line_num,
                        column=match.start() + column
                    ))
        
        return tokens

class AssemblyScanner:
    """Scanner for Assembly code"""
    
    def scan(self, source_code: str) -> List[CodeToken]:
        """Scan Assembly source code"""
        tokens = []
        lines = source_code.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Remove comments
            if ';' in line:
                line = line[:line.index(';')]
            
            # Assembly instruction patterns
            parts = line.split()
            if not parts:
                continue
            
            # First part is usually label or instruction
            if parts[0].endswith(':'):
                tokens.append(CodeToken('LABEL', parts[0][:-1], line_num, 1))
                if len(parts) > 1:
                    tokens.append(CodeToken('INSTRUCTION', parts[1], line_num, len(parts[0]) + 1))
            else:
                tokens.append(CodeToken('INSTRUCTION', parts[0], line_num, 1))
            
            # Remaining parts are operands
            for i, operand in enumerate(parts[1:], start=2):
                tokens.append(CodeToken('OPERAND', operand, line_num, sum(len(p) + 1 for p in parts[:i])))
        
        return tokens

class ALGOLScanner:
    """Scanner for ALGOL code"""
    
    def scan(self, source_code: str) -> List[CodeToken]:
        """Scan ALGOL source code"""
        tokens = []
        # ALGOL scanning logic (similar to Fortran but with different syntax)
        # Implementation would parse ALGOL's begin/end blocks, etc.
        return tokens

