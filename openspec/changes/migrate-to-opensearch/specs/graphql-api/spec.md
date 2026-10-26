## ADDED Requirements

### Requirement: Fixed engine-neutral GraphQL loading
GraphQL SHALL remain a supported interface on the current Apollo Server 1.x and GraphQL 0.13 stack with existing routes and `/graphiql` exposure. Core implementations SHALL reside under `src/graphql/search/`, loaded by fixed search schema/resolver globs with extension loading preserved. No `server.searchEngine` selector SHALL remain. The build SHALL copy the renamed schemas into matching output paths.

#### Scenario: Source and built schema loading
- **WHEN** GraphQL starts from source or compiled distribution
- **THEN** core and extension schemas/resolvers load without an engine selector or reference to the removed directory

### Requirement: Typeless resolvers and stable source arguments
Products, categories, cmsPages, cmsBlocks, customAttributeMetadata, taxrule and reviews SHALL use the selected store's OpenSearch base, shared alias helper and wrapped response body. CMS queries MUST resolve cms_page and cms_block respectively instead of cms. Public `_sourceInclude`/`_sourceExclude` arguments SHALL remain unchanged where exposed, translated consistently to client `_source_includes`/`_source_excludes`; product processor mock HTTP input SHALL retain the existing public singular spellings.

#### Scenario: CMS entity selection
- **WHEN** a client executes cmsPages or cmsBlocks
- **THEN** the resolver searches the cms_page or cms_block alias respectively without mapping type or a cms alias

#### Scenario: Supported query projections
- **WHEN** a supported query accepts a source include/exclude argument
- **THEN** it uses plural snake-case OpenSearch client parameters rather than camel-case or singular engine parameters, retaining the existing GraphQL argument names

### Requirement: Numeric product totals and body aggregations
The products resolver MUST set `body.track_total_hits=true`, use the shared total normalizer for numeric `total_count`, read `response.body.aggregations` and retain attribute metadata enrichment, sort/page information and product processing. It SHALL pass explicit entity product to processors rather than reading removed indexTypes. Other current resolvers that expose no exact count SHALL not add count tracking.

#### Scenario: Products with aggregations
- **WHEN** OpenSearch returns object total and aggregations for a products query
- **THEN** total_count is a number, aggregation and attribute metadata fields are populated from the body, and processed items/page/sort information retain their existing shape

### Requirement: CMS hierarchy query kept typeless
The `cmsHierarchies` query, its resolver and the `CmsHierarchies`/`CmsHierarchy` schema types SHALL remain. All three CMS queries MUST resolve their alias from the query's `type` argument (defaults `cms_page`, `cms_block`, `cms_hierarchy`) through the shared alias helper. `cmsHierarchies` MUST NOT be redirected to another entity; while no producer exists it SHALL return the engine's missing-index error through the normal GraphQL error path.

#### Scenario: Hierarchy query without a producer
- **WHEN** a client executes cmsHierarchies and `<base>_cms_hierarchy` does not exist
- **THEN** the resolver searches only `<base>_cms_hierarchy` and the response carries the engine's missing-index error, while cmsPages and cmsBlocks keep working
