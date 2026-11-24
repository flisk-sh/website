# frozen_string_literal: true

require "minitest/autorun"

# The org bar (flisk.si bar.js) already shows the Flisk logo, so the site's
# own header carries the wordmark only. The footer may keep its mark.
class HeaderBrandTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)

  def header
    File.read(File.join(ROOT, "_includes/navigation.html"), encoding: "UTF-8")
  end

  def test_header_has_the_wordmark_and_no_logo_mark
    assert_includes header, '<span class="aw-brand-wordmark">flisk</span>'
    refute_includes header, "aw-brand-mark"
    refute_match(/<(img|svg)\b/, header[/<a class="aw-brand".*?<\/a>/m].to_s)
  end

  def test_header_brand_still_links_home_with_a_label
    assert_match(/<a class="aw-brand" href="[^"]+" aria-label="Flisk CLI home">/, header)
  end
end
