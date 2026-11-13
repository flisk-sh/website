# frozen_string_literal: true

require "minitest/autorun"

# Trust is on every surface, not on one page: the install box carries its
# verify link, the homepage states its limits with a source for each, and the
# footer links the proof. Guard that none of them is quietly removed.
class TrustSurfacesTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def read(path)
    File.read(File.join(ROOT, path), encoding: "UTF-8")
  end

  def test_install_box_links_the_release_verification
    assert_includes read("_includes/demo-box.html"), "docs/security.md#releases"
  end

  def test_every_limit_has_a_source_link
    section = read("index.html")[%r{<section class="aw-section aw-limits".*?</section>}m]
    refute_nil section, "limits section is missing from the homepage"
    items = section.scan(%r{<li>.*?</li>}m)
    assert_operator items.size, :>=, 5
    items.each { |li| assert_match(/<a href=/, li, "limit without a source: #{li[0, 60]}") }
  end

  def test_footer_links_security_support_and_changelog
    footer = read("_includes/footer.html")
    %w[security.md#releases SUPPORT.md MAINTAINERS.md CHANGELOG.md #limits].each do |needle|
      assert_includes footer, needle
    end
  end
end
