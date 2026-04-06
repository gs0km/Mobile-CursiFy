const indigoPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AAAgMBgAIX+JkAAAAASUVORK5CYII=";
const greenPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8zwAAAgMBgAIud6kAAAAASUVORK5CYII=";
const amberPixel =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58AAwMCAO+a9a0AAAAASUVORK5CYII=";

const portuguesImage =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMjQwJyB2aWV3Qm94PScwIDAgNDAwIDI0MCc+CiAgPHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PScyNDAnIGZpbGw9JyMwMDljM2InLz4KICA8cG9seWdvbiBwb2ludHM9JzIwMCwyMCAzODAsMTIwIDIwMCwyMjAgMjAsMTIwJyBmaWxsPScjRkZERjAwJy8+CiAgPGNpcmNsZSBjeD0nMjAwJyBjeT0nMTIwJyByPSc3MCcgZmlsbD0nIzAwMjc3NicvPgogIDx0ZXh0IHg9JzIwMCcgeT0nMTA4JyBmb250LWZhbWlseT0nR2VvcmdpYSxzZXJpZicgZm9udC1zaXplPScyOCcgZm9udC13ZWlnaHQ9J2JvbGQnIGZpbGw9J3doaXRlJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJz5MaW5ndWE8L3RleHQ+CiAgPHRleHQgeD0nMjAwJyB5PScxNDInIGZvbnQtZmFtaWx5PSdHZW9yZ2lhLHNlcmlmJyBmb250LXNpemU9JzI4JyBmb250LXdlaWdodD0nYm9sZCcgZmlsbD0nd2hpdGUnIHRleHQtYW5jaG9yPSdtaWRkbGUnPlBvcnR1Z3Vlc2E8L3RleHQ+Cjwvc3ZnPg==";

const matematicaImage =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMjQwJyB2aWV3Qm94PScwIDAgNDAwIDI0MCc+CiAgPHJlY3Qgd2lkdGg9JzQwMCcgaGVpZ2h0PScyNDAnIGZpbGw9JyMxZTNhNWYnLz4KICA8dGV4dCB4PScyMDAnIHk9JzgwJyBmb250LWZhbWlseT0nR2VvcmdpYSxzZXJpZicgZm9udC1zaXplPSc0OCcgZm9udC13ZWlnaHQ9J2JvbGQnIGZpbGw9JyNmNTllMGInIHRleHQtYW5jaG9yPSdtaWRkbGUnPnjCsit5wrI8L3RleHQ+CiAgPHRleHQgeD0nMjAwJyB5PScxNDAnIGZvbnQtZmFtaWx5PSdHZW9yZ2lhLHNlcmlmJyBmb250LXNpemU9JzM2JyBmb250LXdlaWdodD0nYm9sZCcgZmlsbD0nd2hpdGUnIHRleHQtYW5jaG9yPSdtaWRkbGUnPuKIkSDiiKsgz4A8L3RleHQ+CiAgPHRleHQgeD0nMjAwJyB5PScyMDAnIGZvbnQtZmFtaWx5PSdHZW9yZ2lhLHNlcmlmJyBmb250LXNpemU9JzI4JyBmb250LXdlaWdodD0nYm9sZCcgZmlsbD0nIzkzYzVmZCcgdGV4dC1hbmNob3I9J21pZGRsZSc+TWF0ZW1hdGljYTwvdGV4dD4KPC9zdmc+";

export const courseImagesByCategory: Record<string, string> = {
  coding: indigoPixel,
  development: indigoPixel,
  business: greenPixel,
  data: greenPixel,
  design: amberPixel,
  art: amberPixel,
  marketing: greenPixel,
  portugues: portuguesImage,
  "português": portuguesImage,
  portuguese: portuguesImage,
  lingua: portuguesImage,
  linguagem: portuguesImage,
  matematica: matematicaImage,
  "matemática": matematicaImage,
  math: matematicaImage,
  calculo: matematicaImage,
  "cálculo": matematicaImage,
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