class NewsArticle {
  const NewsArticle({
    required this.title,
    required this.description,
    required this.url,
    required this.imageUrl,
    required this.sourceName,
  });

  final String title;
  final String description;
  final String url;
  final String imageUrl;
  final String sourceName;

  factory NewsArticle.fromJson(Map<String, dynamic> json) {
    final Map<String, dynamic> source =
        json['source'] as Map<String, dynamic>? ?? {};

    return NewsArticle(
      title: json['title'] as String? ?? 'No title',
      description: json['description'] as String? ?? 'No description',
      url: json['url'] as String? ?? '',
      imageUrl: json['urlToImage'] as String? ?? '',
      sourceName: source['name'] as String? ?? 'Unknown source',
    );
  }
}
