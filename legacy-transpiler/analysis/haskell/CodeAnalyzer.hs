{-
Purpose: Legacy-to-Logic Transpiler - Analysis Stage using Haskell
Dependencies: GHC, Parsec
Module Role: Uses functional programming to break code down into pure mathematical logic
-}

module CodeAnalyzer where

import Data.List
import Data.Maybe
import Text.ParserCombinators.Parsec

-- Abstract syntax tree for legacy code
data LegacyCode = 
    FortranProgram [Statement]
  | AssemblyProgram [Instruction]
  | AlgolProgram [Block]
  deriving (Show, Eq)

data Statement = 
    Assignment String Expression
  | Conditional Expression Statement (Maybe Statement)
  | Loop String Expression Statement
  | SubroutineCall String [Expression]
  deriving (Show, Eq)

data Expression = 
    Literal Int
  | Variable String
  | BinaryOp Op Expression Expression
  | FunctionCall String [Expression]
  deriving (Show, Eq)

data Op = Add | Subtract | Multiply | Divide | Equal | NotEqual
  deriving (Show, Eq)

data Instruction = 
    MOV String String
  | ADD String String
  | SUB String String
  | JMP String
  | CMP String String
  deriving (Show, Eq)

data Block = 
    BeginBlock [Statement]
  | EndBlock
  deriving (Show, Eq)

-- Pure mathematical representation
data PureLogic = 
    PureFunction String [String] PureExpression
  | PureValue Int
  | PureVariable String
  | PureComposition [PureLogic]
  deriving (Show, Eq)

data PureExpression = 
    PureLiteral Int
  | PureVar String
  | PureApply String [PureExpression]
  | PureLambda String PureExpression
  deriving (Show, Eq)

-- Convert legacy code to pure logic
analyzeCode :: LegacyCode -> PureLogic
analyzeCode (FortranProgram statements) = 
    PureComposition (map analyzeStatement statements)
analyzeCode (AssemblyProgram instructions) = 
    PureComposition (map analyzeInstruction instructions)
analyzeCode (AlgolProgram blocks) = 
    PureComposition (map analyzeBlock blocks)

analyzeStatement :: Statement -> PureLogic
analyzeStatement (Assignment var expr) = 
    PureFunction var [] (analyzeExpression expr)
analyzeStatement (Conditional cond thenStmt maybeElse) = 
    -- Convert to pure conditional logic
    PureComposition [
        analyzeExpression cond,
        analyzeStatement thenStmt,
        maybe (PureValue 0) analyzeStatement maybeElse
    ]
analyzeStatement (Loop var expr body) = 
    -- Convert loop to pure recursion
    PureFunction var [] (analyzeExpression expr)
analyzeStatement (SubroutineCall name args) = 
    PureApply name (map analyzeExpression args)

analyzeExpression :: Expression -> PureExpression
analyzeExpression (Literal n) = PureLiteral n
analyzeExpression (Variable v) = PureVar v
analyzeExpression (BinaryOp op e1 e2) = 
    PureApply (opToFunction op) [analyzeExpression e1, analyzeExpression e2]
analyzeExpression (FunctionCall name args) = 
    PureApply name (map analyzeExpression args)

opToFunction :: Op -> String
opToFunction Add = "add"
opToFunction Subtract = "subtract"
opToFunction Multiply = "multiply"
opToFunction Divide = "divide"
opToFunction Equal = "equal"
opToFunction NotEqual = "notEqual"

analyzeInstruction :: Instruction -> PureLogic
analyzeInstruction (MOV dest src) = 
    PureFunction dest [] (PureVar src)
analyzeInstruction (ADD dest src) = 
    PureFunction dest [] (PureApply "add" [PureVar dest, PureVar src])
analyzeInstruction (SUB dest src) = 
    PureFunction dest [] (PureApply "subtract" [PureVar dest, PureVar src])
analyzeInstruction (JMP label) = 
    PureFunction label [] (PureValue 0)
analyzeInstruction (CMP op1 op2) = 
    PureApply "compare" [PureVar op1, PureVar op2]

analyzeBlock :: Block -> PureLogic
analyzeBlock (BeginBlock statements) = 
    PureComposition (map analyzeStatement statements)
analyzeBlock EndBlock = PureValue 0

-- Extract pure mathematical functions
extractPureFunctions :: PureLogic -> [PureLogic]
extractPureFunctions (PureFunction name params expr) = 
    [PureFunction name params expr]
extractPureFunctions (PureComposition functions) = 
    concatMap extractPureFunctions functions
extractPureFunctions _ = []

-- Optimize pure logic
optimizePureLogic :: PureLogic -> PureLogic
optimizePureLogic (PureComposition functions) = 
    PureComposition (map optimizePureLogic functions)
optimizePureLogic (PureApply name args) = 
    PureApply name (map optimizePureLogic args)
optimizePureLogic logic = logic

