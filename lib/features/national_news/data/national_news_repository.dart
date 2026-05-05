import '../../../core/network/news_api_service.dart';
import '../../../shared/models/news_article.dart';

class NationalNewsRepository {
  const NationalNewsRepository(this._service);

  final NewsApiService _service;

  Future<List<NewsArticle>> fetchNationalNews() {
    return _service.getTopHeadlines(country: 'in');
  }
}
