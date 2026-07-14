import { GetPlansController } from "./GetPlansController.js";
import { GetPlansUseCase } from "./GetPlansUseCase.js";

const getPlansUseCase: GetPlansUseCase = new GetPlansUseCase();
const getPlansController: GetPlansController = new GetPlansController(getPlansUseCase);

export { getPlansController }