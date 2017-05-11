// @flow

export type ToolSet = {
  "pen": ToolSpec,
  "eraser": ToolSpec,
};

export type Tool = $Keys<ToolSet>;

export type ToolSpec = {
  compositeOperation: "source-over" | "destination-out",
  brush: VariableBrush | ConstantBrush,
};

export type VariableBrush = {
  brushType: "variable",
  fastBrushWidth: number,
  slowBrushWidth: number,
  fastBrushWidthVelocity: number,
};

export type ConstantBrush = {
  brushType: "constant",
  brushWidth: number,
};

const scratchpadTools: ToolSet = {
  pen: {
    compositeOperation: "source-over",
    brush: {
      brushType: "variable",
      fastBrushWidth: 1.5,
      slowBrushWidth: 3,
      fastBrushWidthVelocity: 9,
    },
  },
  eraser: {
    compositeOperation: "destination-out",
    brush: {
      brushType: "variable",
      fastBrushWidth: 100,
      slowBrushWidth: 50,
      fastBrushWidthVelocity: 30,
    },
  },
};

export default scratchpadTools;
