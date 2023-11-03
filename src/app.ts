import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

app.get("/", (_req, res) => {
  res.json({ message: "Hello World!" }).status(200);
});

app.get("/dogs", async (req, res) => {
  try {
    const dogs = await prisma.dog.findMany();
    return res.status(200).send(dogs);
  } catch (e) {
    console.error(e);
  }
});

app.get("/dogs/:id", async (req, res) => {
  try {
    const id = +req.params.id;

    if (isNaN(id))
      return res.status(400).send({
        message: "id should be a number",
      });

    const dog = await prisma.dog.findUnique({
      where: {
        id,
      },
    });

    if (!dog) return res.status(204).send(null);
    return res.status(200).send(dog);
  } catch (e) {
    console.error(e);
  }
});

app.post("/dogs", async (req, res) => {
  const name = req?.body?.name;
  const description = req?.body?.description;
  const breed = req?.body?.breed;
  const age = req?.body?.age;

  const errors = [];

  if (typeof name !== "string")
    errors.push("name should be a string");

  if (typeof description !== "string")
    errors.push("description should be a string");

  if (typeof breed !== "string")
    errors.push("breed should be a string");

  if (typeof age !== "number")
    errors.push("age should be a number");

  Object.keys(req.body).filter((key) => {
    switch (key) {
      case "name":
        return true;
      case "description":
        return true;
      case "breed":
        return true;
      case "age":
        return true;
      default:
        errors.push(`'${key}' is not a valid key`);
        break;
    }
  });

  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof breed !== "string" ||
    typeof age !== "number"
  ) {
    // Not entirely sure if this is what you wanted, but I hard coded the errors object
    return res.status(400).json({
      errors: errors,
    });
  }

  try {
    await prisma.dog.create({
      data: {
        name: name,
        description: description,
        breed: breed,
        age: age,
      },
    });
  } catch (e) {
    return res.send(e);
  }

  return res.status(201).send(req.body);
});

app.patch("/dogs/:id", async (req, res) => {
  const id = +req.params.id;

  const errors = Object.keys(req.body)
    .filter((key) => {
      if (
        key === "name" ||
        key === "age" ||
        key === "description" ||
        key === "breed"
      )
        return false;
      else return true;
    })
    .map((key) => `'${key}' is not a valid key`);

  if (errors.length > 0)
    return res.status(400).json({
      errors: errors,
    });

  try {
    await prisma.dog.update({
      where: {
        id,
      },
      data: {
        ...req.body,
      },
    });
  } catch (e) {
    return res.status(400).json({
      error: e,
    });
  }

  return res.status(201).send(req.body);
});

app.delete("/dogs/:id", async (req, res) => {
  const id = +req.params.id;

  if (isNaN(id))
    return res.status(400).json({
      message: "id should be a number",
    });

  const deleted = await Promise.resolve()
    .then(() =>
      prisma.dog.delete({
        where: {
          id,
        },
      })
    )
    .catch(() => null);

  if (deleted === null)
    return res.status(204).send("Couldn't delete");

  return res.status(200).send(deleted);
});
// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
