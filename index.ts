import * as ts from "typescript";

const isLeafNode = (node: ts.Node) => {
  return node.getChildCount() === 0;
};

const visit = (
  node: ts.Node,
  output: any,
  typeNameRef: { current: string }
) => {
  if (ts.isTypeAliasDeclaration(node)) {
    //grab the type name from the type alias declaration
    const typeName = node.name.text.toLowerCase();
    typeNameRef.current = typeName;
    if (!output[typeName]) {
      output[typeName] = {};
    }
  }

  if (isLeafNode(node) && ts.isIdentifier(node)) {
    const propertyName = node.escapedText;
    //find an identifier leaf node to get the key:value pair from
    if (
      ts.isPropertySignature(node.parent) ||
      ts.isTypeAliasDeclaration(node.parent)
    ) {
      const typeNode = node.parent.type;
      let value;
      if (typeNode && !ts.isTypeLiteralNode(typeNode)) {
        //we want to exclude type literals because they are not the farthest down the AST we can get
        if (ts.isUnionTypeNode(typeNode)) {
          value = typeNode.types.map((typePart) => typePart.getText());
        } else {
          value = typeNode.getText();
        }
      }

      //assign the property name and value to the output object
      if (propertyName && value) {
        output[typeNameRef.current][propertyName] = value;
      }
    }
  }
};

const convertToObject = (type: string) => {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    type,
    ts.ScriptTarget.Latest,
    true
  );

  const typeNameRef = { current: "" };
  const output: any = {};
  //recursively visit each node
  const traverse = (node: ts.Node) => {
    visit(node, output, typeNameRef);
    node.forEachChild((child) => traverse(child));
  };

  traverse(sourceFile);

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
];

testCases.forEach((testCase) => {
  console.log(testCase);
  console.log(convertToObject(testCase));
});
