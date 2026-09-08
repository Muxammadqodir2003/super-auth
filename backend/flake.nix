{
  description = "Node.js and Prisma NixOS optimized environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            pnpm
            # Prisma va OpenSSL paketlari
            openssl
            prisma-engines
            
            # ESKI VARIANT: nodePackages.prisma
            # YANGI VARIANT: Shunchaki to'g'ridan-to'g'ri 'prisma' deb yozamiz
            prisma 
            nest-cli
          ];

          # Prisma internetdan 404 dvigatellarni qidirmasligi uchun mahalliy yo'llar
          PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
          PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
          PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines}/lib/libquery_engine.node";
          PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
          
          # Node.js OpenSSL kutubxonasini topishi uchun
          OPENSSL_DIR = "${pkgs.openssl.dev}";
          OPENSSL_LIB_DIR = "${pkgs.openssl.out}/lib";

          shellHook = ''
            echo "⚡ Node.js va Prisma muhiti muvaffaqiyatli yuklandi!"
            echo "Node version: $(node -v)"
            echo "Prisma local engines tayyor."
          '';
        };
      }
    );
}