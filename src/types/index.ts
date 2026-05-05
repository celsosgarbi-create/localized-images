export interface LocalizedText {
  id: string;
  key: string;
  value: string;
  createdAt: string;
}

export interface FigmaTextComponent {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
}

export interface FigmaTemplate {
  imageUrl: string;
  width: number;
  height: number;
  textComponents: FigmaTextComponent[];
  fetchedAt: string;
}

export interface ImageTextValue {
  componentId: string;
  localizationId: string | null;
  customText: string;
}

export type ImageStatus = 'draft' | 'saved';

export interface LocalizedImage {
  id: string;
  name: string;
  figmaUrl: string;
  template: FigmaTemplate | null;
  textValues: ImageTextValue[];
  status: ImageStatus;
  createdAt: string;
  updatedAt: string;
}
