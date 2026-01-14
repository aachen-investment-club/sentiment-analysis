"""
Utility functions for API data transformation.

This module provides functions to transform DynamoDB items into JSON-serializable formats
for FastAPI responses. DynamoDB returns numeric values as Decimal types, which are not
JSON-serializable, so these utilities convert them to standard Python types.

Usage:
    When AWS functions return DynamoDB items (from scan, get_item, query operations),
    you MUST transform them before returning to the API client.

    Example:
        from backend.aws_querying.DocumentData import list_articles
        from backend.api.utils import transform_dynamodb_item
        
        # Get articles from DynamoDB
        articles = list_articles()  # Returns items with Decimal types
        
        # Transform each article before returning
        transformed = [transform_dynamodb_item(article) for article in articles]
        return transformed  # Now JSON-serializable

When to use:
    ✅ Use transform_dynamodb_item() when:
        - Reading from DynamoDB (scan, get_item, query)
        - Returning DynamoDB items in API responses
        - Data contains Decimal types
    
    ❌ Don't use when:
        - AWS function returns boolean (success/failure)
        - AWS function returns strings (S3 content)
        - Data is already JSON-serializable

Functions:
    - transform_dynamodb_item(): Main function to transform DynamoDB items
    - convert_decimal_to_float(): Low-level function for Decimal conversion
"""
from decimal import Decimal
from typing import Any, Dict, List


def convert_decimal_to_float(obj: Any) -> Any:
    """
    Recursively convert Decimal types to float for JSON serialization.
    
    This is a low-level utility function. In most cases, you should use
    transform_dynamodb_item() instead, which includes additional validations.
    
    Args:
        obj: Object that may contain Decimal types (dict, list, or Decimal)
        
    Returns:
        Object with all Decimal types converted to float. Preserves structure
        of nested dictionaries and lists.
    
    Example:
        >>> from decimal import Decimal
        >>> item = {"score": Decimal("0.75"), "nested": {"value": Decimal("1.5")}}
        >>> result = convert_decimal_to_float(item)
        >>> result
        {'score': 0.75, 'nested': {'value': 1.5}}
    
    Note:
        This function recursively processes nested structures:
        - Decimal → float
        - Dict → Dict with converted values
        - List → List with converted items
        - Other types → Returned as-is
    """
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: convert_decimal_to_float(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimal_to_float(item) for item in obj]
    else:
        return obj


def transform_dynamodb_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a DynamoDB item to a JSON-serializable format.
    
    This is the main function to use when processing DynamoDB items for API responses.
    It handles:
    1. Converting Decimal types to float (for JSON serialization)
    2. Ensuring date fields are strings
    3. Validating list fields (assets, commodities, markets)
    
    Args:
        item: DynamoDB item dictionary (from scan, get_item, or query operations)
        
    Returns:
        Transformed dictionary ready for JSON serialization. All Decimal types
        are converted to float, dates are strings, and list fields are validated.
    
    Example:
        >>> from backend.aws_querying.DocumentData import list_articles
        >>> from backend.api.utils import transform_dynamodb_item
        >>> 
        >>> # Get articles from DynamoDB
        >>> articles = list_articles()
        >>> 
        >>> # Transform for API response
        >>> transformed = [transform_dynamodb_item(article) for article in articles]
        >>> return transformed  # Ready for FastAPI response
    
    Example with single item:
        >>> from backend.aws_querying.DocumentData import check_exists_article_sentiment_analysis
        >>> 
        >>> sentiment = check_exists_article_sentiment_analysis(document_id)
        >>> if sentiment:
        >>>     return transform_dynamodb_item(sentiment)
    
    What it does:
        1. Converts all Decimal types to float (recursively)
        2. Ensures 'date' field is a string (if present)
        3. Validates 'assets', 'commodities', 'markets' are lists (defaults to [] if not)
    
    When to use:
        - ✅ After calling list_articles() - returns DynamoDB items
        - ✅ After calling check_exists_article_sentiment_analysis() - returns DynamoDB item
        - ✅ After any DynamoDB read operation (scan, get_item, query)
        - ❌ NOT needed for boolean returns (add_article_text, etc.)
        - ❌ NOT needed for string returns (get_articles_s3, etc.)
    
    Raises:
        No exceptions - safely handles missing fields and type mismatches
    """
    # Convert Decimal types to float/int
    transformed = convert_decimal_to_float(item)
    
    # Ensure date is a string if present
    if 'date' in transformed and not isinstance(transformed['date'], str):
        transformed['date'] = str(transformed['date'])
    
    # Ensure lists are properly formatted
    for key in ['assets', 'commodities', 'markets']:
        if key in transformed and not isinstance(transformed[key], list):
            transformed[key] = []
    
    return transformed
