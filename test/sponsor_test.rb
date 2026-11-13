# frozen_string_literal: true

require "minitest/autorun"

ROOT = File.expand_path("..", __dir__) unless defined?(ROOT)

class SponsorTest < Minitest::Test
  URL = "https://github.com/sponsors/flisk-sh"

  def test_home_page_has_a_visible_sponsor_section_above_the_license_form
    source = File.read(File.join(ROOT, "index.html"))
    assert_includes source, 'id="sponsor"'
    assert_includes source, "Sponsor Flisk on GitHub"
    assert_includes source, URL
    assert_operator source.index('id="sponsor"'), :<, source.index('id="waitlist"')
  end

  def test_nav_and_footer_link_to_sponsors
    assert_includes File.read(File.join(ROOT, "_includes/navigation.html")), URL
    assert_includes File.read(File.join(ROOT, "_includes/footer.html")), URL
  end

  def test_sponsor_copy_makes_no_tier_or_key_promise
    source = File.read(File.join(ROOT, "index.html"))
    section = source[/id="sponsor".*?<\/section>/m]
    refute_match(/\$\d/, section)
    refute_match(/license key|Premium/i, section)
  end
end
