/**
 * Renders a JSON-LD structured-data block. Server component; no client JS.
 * The `<` escape prevents a `</script>` breakout (defensive — data is static).
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
