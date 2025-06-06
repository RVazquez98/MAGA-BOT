
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.libuuid
    pkgs.cairo
    pkgs.pango
    pkgs.giflib
    pkgs.librsvg
    pkgs.pixman
    pkgs.pkg-config
    pkgs.fontconfig
    pkgs.freetype
  ];
}
