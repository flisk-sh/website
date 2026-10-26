# frozen_string_literal: true

require "minitest/autorun"

ROOT = File.expand_path("..", __dir__)

class LicensingCopyTest < Minitest::Test
  FILES = [
    "index.html",
    "_includes/navigation.html",
    "_includes/footer.html",
    "waiting/index.html",
    "docs/quickstart/index.html",
    "_data/flisk.yml",
    "_site/index.html"
  ].freeze

  BANNED_PATTERNS = [
    /free license/i,
    /get a free license/i,
    /get free license/i,
    /issue-free-license/i,
    /ISSUE_FREE/,
    /showIssuedKey/,
    /waitlist-issued-key/,
    /free_project_limit/,
    /Free —/
  ].freeze

  def test_free_needs_no_license_and_premium_is_the_license_path
    source = read("index.html")

    assert_includes source, "Free needs no license key"
    assert_includes source, "Start free"
    assert_includes source, "Get your<br />Premium license."
    assert_includes source, "Request my license"
    assert_includes source, 'value="Premium — ${{ site.data.flisk.team_price }}/dev/month'
    refute_includes source, 'value="Free —'
  end

  def test_navigation_and_footer_point_to_premium_license
    assert_includes read("_includes/navigation.html"), "Premium license"
    assert_includes read("_includes/footer.html"), "Premium license"
  end

  def test_no_stale_free_license_copy_or_instant_key_javascript
    FILES.each do |file|
      content = read(file)
      BANNED_PATTERNS.each do |pattern|
        refute_match pattern, content, "#{file} still contains #{pattern.inspect}"
      end
    end
  end

  private

  def read(path)
    File.read(File.join(ROOT, path))
  end
end
