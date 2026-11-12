# frozen_string_literal: true

require "minitest/autorun"
require "yaml"

# The header menus come from _data/nav.yml. An unquoted comma inside a
# flow mapping silently splits a value into a new key, which cut menu
# descriptions short ("enterprise license: sso"). Guard every entry.
class NavDataTest < Minitest::Test
  ROOT = File.expand_path("..", __dir__)
  KEYS = %w[name desc desc_from href icon bi].freeze

  def links
    YAML.load_file(File.join(ROOT, "_data/nav.yml")).flat_map do |_menu, groups|
      groups.flat_map { |g| g.fetch("links") }
    end
  end

  def test_every_link_has_only_known_keys
    links.each do |l|
      assert_empty l.keys - KEYS, "unexpected keys in #{l.inspect} (quote values with commas)"
    end
  end

  def test_every_link_has_a_name_href_and_description
    links.each do |l|
      assert l["name"].is_a?(String) && !l["name"].empty?, "missing name in #{l.inspect}"
      assert l["href"].is_a?(String) && !l["href"].empty?, "missing href in #{l.inspect}"
      assert l["desc"] || l["desc_from"], "missing desc in #{l.inspect}"
    end
  end

  def test_every_icon_file_exists
    links.each do |l|
      next unless l["icon"]

      path = File.join(ROOT, "assets/img", "#{l['icon']}.svg")
      assert File.exist?(path), "#{l['name']} points at missing icon #{path}"
    end
  end
end
