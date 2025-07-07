{
  description = "Maestro Effect - Effect-native wrapper for Maestro mobile testing";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    nixpkgsUnstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, nixpkgsUnstable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { 
          inherit system;
          config.allowUnfree = true;
        };
        pkgsUnstable = import nixpkgsUnstable { 
          inherit system;
          config.allowUnfree = true;
        };
        
        nodejs = pkgs.nodejs_24;
        
        # Enable corepack for pnpm
        corepack = pkgs.runCommand "corepack-enable" {} ''
          mkdir -p $out/bin
          ${nodejs}/bin/corepack enable --install-directory $out/bin
        '';
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core tools
            nodejs
            corepack
            pkgsUnstable.bun
            pkgsUnstable.maestro
            
            # iOS development
            darwin.apple_sdk.frameworks.CoreServices
            darwin.apple_sdk.frameworks.CoreFoundation
            
            # Expo/React Native
            watchman
            cocoapods
            
            # Utilities
            jq
            ripgrep
            curl
          ];

          shellHook = ''
            # Fix SDK conflicts between Nix and Xcode
            unset SDKROOT NIX_APPLE_SDK_VERSION NIX_LDFLAGS NIX_CFLAGS_COMPILE 2>/dev/null || true
            export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
            
            # Set up PATH
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            echo "🎯 Maestro Effect Development Environment"
            echo "📱 Maestro $(maestro --version 2>/dev/null || echo 'not found')"
            echo "🟢 Node $(node --version)"
            echo "🐰 Bun $(bun --version)"
            echo ""
            echo "Run 'pnpm install' to install dependencies"
            echo "Run 'pnpm build' to build the library"
            echo "Run 'cd examples/expo-app && pnpm start' to start the example app"
          '';
        };
      });
}