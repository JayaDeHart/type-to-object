import * as ts from "typescript";

const handleInterfaceDeclaration = (
  node: ts.InterfaceDeclaration,
  output: any
) => {
  const interfaceName = node.name.text.toLowerCase();

  if (!output[interfaceName]) {
    output[interfaceName] = {};
  }

  node.members.forEach((member) => {
    if (ts.isPropertySignature(member)) {
      handlePropertySignature(member, output, interfaceName);
    }
  });
};

const handleTypeAliasDeclaration = (
  node: ts.TypeAliasDeclaration,
  output: any
) => {
  const typeName = node.name.text.toLowerCase();

  if (!output[typeName]) {
    output[typeName] = ts.isTypeLiteralNode(node.type) ? {} : [];
  }

  if (ts.isTypeLiteralNode(node.type)) {
    node.type.members.forEach((member) => {
      if (ts.isPropertySignature(member)) {
        handlePropertySignature(member, output, typeName);
      }
    });
  } else {
    const value = checkTypeAndGetValue(node.type);
    output[typeName] = value;
  }
};

const handlePropertySignature = (
  node: ts.PropertySignature,
  output: any,
  typeName: string
) => {
  const propertyName = node.name.getText();

  if (!propertyName || !node.type) return;

  const value = checkTypeAndGetValue(node.type);

  if (value) {
    output[typeName][propertyName] = value;
  }
};

const checkTypeAndGetValue = (node: ts.TypeNode | undefined) => {
  if (!node) return undefined; // Safely handle undefined types

  if (ts.isUnionTypeNode(node)) {
    return node.types.map((typeNode) => typeNode.getText());
  }

  if (ts.isIntersectionTypeNode(node)) {
    return node.types.map((typeNode) => typeNode.getText());
  }

  if (ts.isTypeReferenceNode(node)) {
    return node.getText();
  }

  return node.getText();
};

const visit = (node: ts.Node, output: any) => {
  if (ts.isTypeAliasDeclaration(node)) {
    handleTypeAliasDeclaration(node, output);
  }

  if (ts.isInterfaceDeclaration(node)) {
    handleInterfaceDeclaration(node, output);
  }
};

// Core traversal function
const traverse = (node: ts.Node, output: any) => {
  visit(node, output);
  node.forEachChild((child) => traverse(child, output));
};

// Main convertToObject function
const convertToObject = (type: string) => {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    type,
    ts.ScriptTarget.Latest,
    true
  );
  const output: any = {};

  traverse(sourceFile, output);

  return output;
};

const testCases = [
  `type GameResponse = {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: string | null;
  week: string | null;
  venue: string | null;
  status: Status;
  winner: "home" | "away";
  identfier: "true";
};`,
  `type Button = {
    variant: "solid" | "text";
    };`,
  `type InlineDeclare = string | number;
`,
  `interface User {
  id: number;
  name: string;
  status: "active" | "inactive";
}`,
  `type ComplexAlias = { id: number; name: string; } & { age: number };
`,
];

testCases.forEach((testCase) => {
  console.log(testCase);
  console.log(convertToObject(testCase));
});
