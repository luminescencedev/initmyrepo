class Initmyrepo < Formula
  desc "Initialize any project — web, mobile, API, monorepo — in seconds"
  homepage "https://github.com/luminescencedev/initmyrepo"
  url "https://registry.npmjs.org/initmyrepo/-/initmyrepo-1.2.1.tgz"
  sha256 "459b2e79b6ddfe1c555da653628ddf4280b8aef1078d25aa2675b4bbd9845371"
  license "MIT"
  version "1.2.1"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/initmyrepo --version")
  end
end
