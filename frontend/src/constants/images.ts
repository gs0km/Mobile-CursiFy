const indigoPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AAAgMBgAIX+JkAAAAASUVORK5CYII=";
const greenPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8zwAAAgMBgAIud6kAAAAASUVORK5CYII=";
const amberPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58AAwMCAO+a9a0AAAAASUVORK5CYII=";

export const courseImagesByCategory: Record<string, string> = {
  coding: indigoPixel,
  development: indigoPixel,
  business: greenPixel,
  data: greenPixel,
  design: amberPixel,
  art: amberPixel,
  marketing: greenPixel,
  default: indigoPixel,
};

export const defaultAvatarBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9a0AAAAASUVORK5CYII=";

export function pickCourseImage(category: string, title: string): string {
  const normalized = `${category} ${title}`.toLowerCase();
  const match = Object.keys(courseImagesByCategory).find((key) => normalized.includes(key));
  if (!match) {
    return courseImagesByCategory.default;
  }
  return courseImagesByCategory[match];
}