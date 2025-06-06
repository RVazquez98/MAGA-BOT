
{ pkgs }: {
  deps = [
    pkgs.nodejs
    pkgs.libuuid
    pkgs.cairo
    pkgs.pango
    pkgs.giflib
    pkgs.librsvg
    pkgs.pixman
  ];
}
