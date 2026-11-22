# frozen_string_literal: true

require "minitest/autorun"

ROOT = File.expand_path("..", __dir__) unless defined?(ROOT)

# a.js is a copy of public/a.js in flisk-sh/analytics, where its behaviour is tested. These checks keep the promises
# the copy here makes to visitors: no cookies or storage, clicks sent only without Do Not Track or Global Privacy Control,
# and a form field labelled by its kind, never by what is typed in it.
class AnalyticsSnippetTest < Minitest::Test
  def source
    @source ||= File.read(File.join(ROOT, "a.js"))
  end

  def test_sends_pageviews_and_the_click_map_to_flisk_analytics
    assert_includes source, "e: 'clicks'"
    assert_includes source, "k: c ? 'ctl' : 'dead'"
    assert_includes source, "navigator.sendBeacon"
  end

  def test_click_map_respects_do_not_track_and_global_privacy_control
    assert_includes source, "navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl"
  end

  def test_sends_nothing_inside_the_analytics_heatmap_preview
    # The heatmap opens a page as #flisk-preview; that is not a visit.
    assert_includes source, "flisk-preview"
    assert_operator source.index("flisk-preview"), :<, source.index("sendBeacon")
  end

  def test_never_reads_what_is_typed_or_sets_a_cookie
    refute_match(/\.value\b/, source)
    refute_match(/document\.cookie/, source)
    refute_match(/localStorage/, source)
  end
end
