import { LocalClient } from '../client/LocalClient';
import { Context } from '../client/Context';
import { serialize } from '../common/SerializeFunction';

// Every calculate API is async so we need async/await:
async function main() {
  // Create a local instance of dcf:
  const client = new LocalClient();
  // Wait creation process completed:
  await client.init();
  // Create API context:
  const dcc = new Context(client);

  // Create a new rdd.
  const rdd = dcc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).cache();

  // Do some task:
  console.log(await rdd.count());

  // Every API that creates a rdd is not async
  // so we can chain api call like this:
  console.log(
    await rdd
      .map(v => v + 1)
      .filter(v => v % 2 === 0)
      .collect(),
  );

  // Upvalue must be explicit passed and should not be modified:
  const min = 5;
  console.log(await rdd.filter(v => v >= min, { min }).collect());

  // environment is also valid for every upvalue function.
  const test = (v: number) => v >= min;
  console.log(
    await rdd
      .filter(v => test(v), {
        test,
        min,
        // or you can serialized explicitly.
        test1: serialize(test, { min }),
      })
      .collect(),
  );

  console.log(await rdd.union(rdd).collect());

  console.log(
    await rdd
      .union(rdd.map(v => v * 2))
      .distinct()
      .count(),
  );

  await rdd.unpersist();
  // Shutdown
  client.dispose();
}
main().catch(e => console.error(e.stack));
