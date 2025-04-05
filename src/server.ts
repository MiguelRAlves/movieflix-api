import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc"
        },
        include: {
            genres: true,
            languages: true
        }
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;
    try {

        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        });

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Esse filme já foi cadastrado." }
            )
        };

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date)
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "Erro ao cadastrar filme" });
    }
    res.status(201).send("Filme cadastrado com sucesso!");
});

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    const movie = await prisma.movie.findUnique({
        where: { id }
    });
    if (!movie) {
        return res.status(404).send({ message: "Filme não encontrado" });
    }

    const data = { ...req.body };
    data.release_date = data.release_date ? new Date(data.release_date) : undefined;

    try {
        await prisma.movie.update({
            where: { id },
            data: data
        });
    } catch (error) {
        return res.status(500).send({ message: "Erro ao atualizar filme" });
    }
    res.status(200).send("Filme atualizado com sucesso!");
})

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id)
    try {
        const movie = await prisma.movie.findUnique({ where: { id } })
        if (!movie) {
            return res.status(404).send("Filme não encontrado.")
        }

        await prisma.movie.delete({ where: { id } })

    } catch (error) {
        return res.status(500).send("Erro ao deletar filme.")
    }
    res.status(200).send({ message: "Filme deletado com sucesso!"})
})

app.get("/movies/:genreName", async (req, res) => {
    const genre = req.params.genreName;

    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: genre,
                        mode: "insensitive"
                    }
                }
            }
        });

        if (moviesFilteredByGenreName.length === 0) {
            return res.status(404).send("Nenhum filme encontrado com esse gênero.")
        }

        res.status(200).send(moviesFilteredByGenreName);

    } catch (error) {
        res.status(500).send({ message: "Erro ao buscar filmes."});
    }
});

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});